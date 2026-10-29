import { NextRequest, NextResponse } from 'next/server';
import { getAdminByEmail, touchAdminActive, logAudit } from '@/lib/db';
import { verifyPassword, createAdminToken } from '@/lib/auth';
import { fetchAdminFromSupabaseByEmail } from '@/lib/db/supabase-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let admin = getAdminByEmail(cleanEmail);

    // If local container doesn't have this admin, fetch from persistent Supabase
    if (!admin) {
      admin = await fetchAdminFromSupabaseByEmail(cleanEmail);
    }

    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: 'This admin account has been deactivated.' }, { status: 403 });
    }

    const isValid = verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    touchAdminActive(admin.id);
    const token = await createAdminToken(admin);

    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'ADMIN_LOGIN',
      entity_type: 'auth',
      entity_id: admin.id,
      ip_address: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        can_edit_prices: admin.can_edit_prices,
        can_create_discounts: admin.can_create_discounts,
        can_issue_refunds: admin.can_issue_refunds,
        can_override_queue: admin.can_override_queue,
      },
    });

    response.cookies.set('tarot_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
