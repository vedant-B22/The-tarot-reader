import { NextRequest, NextResponse } from 'next/server';
import { createBookingRequest, getServiceById, getDiscountCodeByCode, incrementDiscountCodeUsage, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, service_id, preferred_date, preferred_time, note, promo_code, consent } = body;

    if (!consent) {
      return NextResponse.json({ error: 'You must acknowledge the guidance and entertainment disclaimer.' }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 });
    }

    if (!service_id) {
      return NextResponse.json({ error: 'Please select a tarot reading service.' }, { status: 400 });
    }

    const service = getServiceById(service_id);
    if (!service) {
      return NextResponse.json({ error: 'Selected service was not found.' }, { status: 400 });
    }

    if (!preferred_date || !preferred_time) {
      return NextResponse.json({ error: 'Please choose your preferred date and time.' }, { status: 400 });
    }

    // Calculate pricing and promo discounts
    let discountInr = 0;
    let validPromoCode: string | null = null;

    if (promo_code && promo_code.trim()) {
      const code = promo_code.trim().toUpperCase();
      const discount = getDiscountCodeByCode(code);
      if (discount && discount.is_active) {
        if (discount.discount_type === 'flat') {
          discountInr = Math.min(service.price_inr, discount.discount_value);
        } else if (discount.discount_type === 'percent') {
          const calculated = Math.round((service.price_inr * discount.discount_value) / 100);
          discountInr = discount.max_discount_inr ? Math.min(calculated, discount.max_discount_inr) : calculated;
        }
        validPromoCode = code;
        try { incrementDiscountCodeUsage(code); } catch {}
      }
    }

    const finalPriceInr = Math.max(0, service.price_inr - discountInr);

    const booking = createBookingRequest({
      name,
      phone: cleanPhone,
      service_id: service.id,
      service_name: service.name,
      preferred_date,
      preferred_time,
      note,
      promo_code: validPromoCode || undefined,
      discount_inr: discountInr,
      final_price_inr: finalPriceInr,
    });

    logAudit({
      admin_id: null,
      admin_name: 'Public Visitor',
      action: 'NEW_BOOKING_REQUEST',
      entity_type: 'booking',
      entity_id: booking.id,
      ip_address: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    });

    // Build prefilled WhatsApp message
    const msg = `Hi Vedant! I just requested a tarot reading on your website:
• Name: ${name}
• Service: ${service.name} (₹${finalPriceInr})
• Date: ${preferred_date}
• Time: ${preferred_time}
${note ? `• Question/Note: ${note}\n` : ''}• Ref ID: ${booking.id}`;

    const whatsappLink = `https://wa.me/919226634637?text=${encodeURIComponent(msg)}`;

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        name: booking.name,
        service_name: service.name,
        final_price_inr: finalPriceInr,
        discount_inr: discountInr,
      },
      whatsappLink,
    });
  } catch (err: any) {
    console.error('Booking submission error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit booking request.' }, { status: 500 });
  }
}
