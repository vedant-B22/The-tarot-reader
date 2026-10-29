import { NextRequest, NextResponse } from 'next/server';
import { createLeadSubscriber } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, consent } = await req.json();

    if (!consent) {
      return NextResponse.json({ error: 'Consent is required to receive updates.' }, { status: 400 });
    }

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
      source: 'newsletter',
      consent_given: true,
    });

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to opt in' }, { status: 500 });
  }
}
