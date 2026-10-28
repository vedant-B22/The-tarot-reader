import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { 
  getOrCreateCustomer, 
  getServiceById, 
  createQueueToken, 
  createPayment, 
  getSettings 
} from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { name, phone, course_year, service_id, focus_topic, custom_focus_text, payment_method, cash_received } = await req.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const service = getServiceById(service_id);
    if (!service) {
      return NextResponse.json({ error: 'Invalid service selected' }, { status: 400 });
    }

    // Default walkin placeholder phone if user has none: e.g. 9999900001
    const cleanPhone = phone ? phone.replace(/\D/g, '') : `WALKIN-${Date.now().toString().slice(-6)}`;

    const { customer } = getOrCreateCustomer({
      phone: cleanPhone,
      name: name.trim(),
      course_year: course_year || 'Walk-in Stall Visitor',
    });

    const token = createQueueToken({
      customer_id: customer.id,
      service_id: service.id,
      focus_topic: focus_topic || 'general',
      custom_focus_text: custom_focus_text || null,
      is_walkin: true,
    });

    const payment = createPayment({
      token_id: token.id,
      customer_id: customer.id,
      payment_method: payment_method || 'cash',
      status: 'verified', // Admin verified walkin directly
      base_amount_inr: service.price_inr,
      final_amount_inr: service.price_inr,
    });

    broadcastRealtimeEvent('queue_update', {
      tokenId: token.id,
      tokenNumber: token.token_number,
      tokenDisplay: token.token_display,
      isWalkin: true,
    });

    return NextResponse.json({
      success: true,
      token,
      customer,
      payment,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Walk-in creation failed' }, { status: 500 });
  }
}
