import { NextRequest, NextResponse } from 'next/server';
import { createLeadSubscriber } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, event_id, event_title } = await req.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 });
    }

    const lead = createLeadSubscriber({
      name,
      phone: cleanPhone,
      source: 'event_interest',
      event_id,
      event_title,
      consent_given: true,
    });

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record event interest' }, { status: 500 });
  }
}
