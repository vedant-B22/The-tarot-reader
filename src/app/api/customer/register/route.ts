import { NextRequest, NextResponse } from 'next/server';
import { 
  getSettings, 
  getServiceById, 
  getDiscountCodeByCode, 
  incrementDiscountCodeUsage, 
  getCustomerByReferralCode, 
  getOrCreateCustomer, 
  createQueueToken, 
  createPayment, 
  checkDuplicateUtr, 
  checkDuplicateScreenshotHash, 
  getActiveQueueTokens,
  getTokenById
} from '@/lib/db';
import { savePaymentProof } from '@/lib/storage';
import { createCustomerToken } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = (formData.get('name') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const course_year = (formData.get('course_year') as string || '').trim();
    const service_id = (formData.get('service_id') as string || '').trim();
    const focus_topic = (formData.get('focus_topic') as any || 'general');
    const custom_focus_text = (formData.get('custom_focus_text') as string || '').trim();
    const payment_method = (formData.get('payment_method') as string || 'upi_qr') as 'upi_qr' | 'cash';
    const discount_code_input = (formData.get('discount_code') as string || '').trim().toUpperCase();
    const referral_code_input = (formData.get('referral_code') as string || '').trim().toUpperCase();
    const utr_number = (formData.get('utr_number') as string || '').trim();
    const consent = formData.get('consent');

    if (!consent) {
      return NextResponse.json({ error: 'You must agree to the entertainment disclaimer and terms.' }, { status: 400 });
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid full name.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit WhatsApp phone number.' }, { status: 400 });
    }

    if (!course_year) {
      return NextResponse.json({ error: 'Please enter your college course and year (e.g., B.Tech 3rd Year).' }, { status: 400 });
    }

    // 1. Settings & Queue Status Check
    const settings = getSettings();
    if (!settings.is_queue_open) {
      return NextResponse.json({ 
        error: settings.queue_paused_message || 'The queue is currently paused by the stall reader.' 
      }, { status: 403 });
    }

    const currentWaiting = getActiveQueueTokens();
    if (currentWaiting.length >= settings.max_queue_cap) {
      return NextResponse.json({ 
        error: `Queue is currently at maximum capacity (${settings.max_queue_cap} people). Please check back in a few minutes.` 
      }, { status: 429 });
    }

    // 2. Service Lookup
    const service = getServiceById(service_id);
    if (!service || !service.is_active) {
      return NextResponse.json({ error: 'Selected tarot reading service is currently unavailable.' }, { status: 400 });
    }

    // 3. Server-Side Price Calculation (Never trust client prices)
    const baseAmount = service.price_inr;
    let discountAmount = 0;
    let referralDiscount = 0;
    let validDiscountCode: string | null = null;
    let validReferralCode: string | null = null;

    // A. Automatic Group Discount
    if (service.is_group && settings.group_discount_inr > 0) {
      discountAmount += settings.group_discount_inr;
    }

    // B. Automatic Happy Hour Discount
    if (settings.happy_hour_enabled && settings.happy_hour_percent > 0) {
      // Check current IST time
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      if (currentTime >= settings.happy_hour_start && currentTime <= settings.happy_hour_end) {
        const happyHourDiscount = Math.round((baseAmount * settings.happy_hour_percent) / 100);
        discountAmount += happyHourDiscount;
      }
    }

    // C. Discount Code Validation
    if (discount_code_input) {
      const dCode = getDiscountCodeByCode(discount_code_input);
      if (dCode && dCode.is_active) {
        let codeValid = true;

        if (dCode.valid_until && new Date(dCode.valid_until).getTime() < Date.now()) {
          codeValid = false;
        }
        if (dCode.max_total_uses && dCode.current_uses >= dCode.max_total_uses) {
          codeValid = false;
        }
        if (dCode.min_order_inr && baseAmount < dCode.min_order_inr) {
          codeValid = false;
        }
        if (dCode.applicable_service_ids && !dCode.applicable_service_ids.includes(service.id)) {
          codeValid = false;
        }

        if (codeValid) {
          validDiscountCode = dCode.code;
          let calculated = 0;
          if (dCode.discount_type === 'percent') {
            calculated = Math.round((baseAmount * dCode.discount_value) / 100);
            if (dCode.max_discount_inr && calculated > dCode.max_discount_inr) {
              calculated = dCode.max_discount_inr;
            }
          } else {
            calculated = dCode.discount_value;
          }
          discountAmount += calculated;
          incrementDiscountCodeUsage(dCode.code);
        }
      }
    }

    // D. Referral Benefit Validation
    if (referral_code_input) {
      const referrer = getCustomerByReferralCode(referral_code_input);
      if (referrer && referrer.phone !== cleanPhone) {
        // Legitimate referral from another customer
        validReferralCode = referrer.referral_code;
        referralDiscount = settings.referee_discount_inr;
      }
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount - referralDiscount);

    // 4. Payment Validation
    let screenshotPath: string | null = null;
    let screenshotHash: string | null = null;

    if (payment_method === 'upi_qr') {
      const screenshotFile = formData.get('screenshot') as File | null;
      if (!screenshotFile || screenshotFile.size === 0) {
        return NextResponse.json({ error: 'Please upload your UPI payment confirmation screenshot.' }, { status: 400 });
      }

      if (screenshotFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Screenshot file size exceeds 5MB limit.' }, { status: 400 });
      }

      if (!utr_number || utr_number.length < 6) {
        return NextResponse.json({ error: 'Please enter a valid 12-digit UPI reference / UTR / Transaction ID.' }, { status: 400 });
      }

      // Read file buffer and save securely
      const arrayBuffer = await screenshotFile.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const saved = await savePaymentProof(fileBuffer, screenshotFile.name, screenshotFile.type);
      screenshotPath = saved.path;
      screenshotHash = saved.hash;

      // Duplicate checks
      const dupUtr = checkDuplicateUtr(utr_number);
      if (dupUtr) {
        console.warn(`[FRAUD ALERT] Duplicate UTR detected: ${utr_number}`);
      }

      const dupHash = checkDuplicateScreenshotHash(screenshotHash);
      if (dupHash) {
        console.warn(`[FRAUD ALERT] Duplicate Screenshot image hash detected: ${screenshotHash}`);
      }
    }

    // 5. Customer Record
    const { customer } = getOrCreateCustomer({
      phone: cleanPhone,
      name,
      course_year,
      referred_by_code: validReferralCode || undefined,
    });

    // 6. Queue Token Creation
    const queueToken = createQueueToken({
      customer_id: customer.id,
      service_id: service.id,
      focus_topic,
      custom_focus_text: custom_focus_text || null,
      is_walkin: false,
    });

    // 7. Payment Record
    // Status is pending by default. If pay-later is enabled and cash chosen, still pending until admin verifies.
    const payment = createPayment({
      token_id: queueToken.id,
      customer_id: customer.id,
      payment_method,
      status: 'pending',
      base_amount_inr: baseAmount,
      discount_amount_inr: discountAmount,
      referral_discount_inr: referralDiscount,
      final_amount_inr: finalAmount,
      discount_code_used: validDiscountCode,
      referral_code_used: validReferralCode,
      screenshot_path: screenshotPath,
      screenshot_hash: screenshotHash,
      utr_number: utr_number || null,
    });

    // 8. Realtime Notification
    broadcastRealtimeEvent('queue_update', {
      tokenId: queueToken.id,
      tokenNumber: queueToken.token_number,
      tokenDisplay: queueToken.token_display,
      paymentMethod: payment_method,
      finalAmount,
    });

    // 9. Customer Session Token
    const customerJwt = await createCustomerToken(customer.id, customer.phone);

    const fullToken = getTokenById(queueToken.id);

    const response = NextResponse.json({
      success: true,
      token: fullToken,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        referral_code: customer.referral_code,
      },
      payment: {
        id: payment.id,
        status: payment.status,
        final_amount_inr: payment.final_amount_inr,
      },
    });

    response.cookies.set('tarot_customer_token', customerJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('Registration failed:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
