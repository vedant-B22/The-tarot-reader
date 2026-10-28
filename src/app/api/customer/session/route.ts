import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession, createCustomerToken, verifyCustomerToken } from '@/lib/auth';
import { getCustomerById, getCustomerByPhone, getActiveTokenForCustomer, getTokenById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const customer = getCustomerById(session.customerId);
  if (!customer) {
    return NextResponse.json({ authenticated: false });
  }

  const activeToken = getActiveTokenForCustomer(customer.id);

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      course_year: customer.course_year,
      referral_code: customer.referral_code,
      referral_credits_inr: customer.referral_credits_inr,
      total_readings: customer.total_readings,
    },
    activeToken,
  });
}

// Reconnect with phone number
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const normalized = phone.replace(/\D/g, '');
    const customer = getCustomerByPhone(normalized);

    if (!customer) {
      return NextResponse.json({ found: false, message: 'No registered customer found with this phone number.' });
    }

    const activeToken = getActiveTokenForCustomer(customer.id);
    const token = await createCustomerToken(customer.id, customer.phone);

    const res = NextResponse.json({
      found: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        course_year: customer.course_year,
        referral_code: customer.referral_code,
        referral_credits_inr: customer.referral_credits_inr,
      },
      activeToken,
    });

    res.cookies.set('tarot_customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lookup failed' }, { status: 500 });
  }
}
