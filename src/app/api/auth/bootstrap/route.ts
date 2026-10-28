import { NextRequest, NextResponse } from 'next/server';
import { getAdminCount, createAdmin } from '@/lib/db';
import { hashPassword, createAdminToken, ensureSuperAdminBootstrap } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureSuperAdminBootstrap();
  const count = getAdminCount();
  return NextResponse.json({
    needsBootstrap: count === 0,
    totalAdmins: count,
  });
}

export async function POST(req: NextRequest) {
  try {
    const count = getAdminCount();
    if (count > 0) {
      return NextResponse.json({ error: 'System is already initialized with an admin.' }, { status: 400 });
    }

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const admin = createAdmin({
      email,
      password_hash: hashPassword(password),
      name,
      role: 'super_admin',
      can_edit_prices: true,
      can_create_discounts: true,
      can_issue_refunds: true,
      can_override_queue: true,
    }, 'First Run Wizard');

    const token = await createAdminToken(admin);

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set('tarot_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bootstrap failed' }, { status: 500 });
  }
}
