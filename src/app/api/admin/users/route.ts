import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin, getAdminByEmail } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
  }

  const admins = getAllAdmins().map(a => {
    const { password_hash, ...safeAdmin } = a;
    return safeAdmin;
  });

  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
  }

  const allAdmins = getAllAdmins();
  const regularAdmins = allAdmins.filter(a => a.role === 'admin');
  if (regularAdmins.length >= 5) {
    return NextResponse.json({ error: 'Maximum of 5 regular admins allowed.' }, { status: 400 });
  }

  try {
    const { email, password, name, can_edit_prices, can_create_discounts, can_issue_refunds, can_override_queue } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const existing = getAdminByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 400 });
    }

    const newAdmin = createAdmin({
      email,
      password_hash: hashPassword(password),
      name,
      role: 'admin',
      can_edit_prices: Boolean(can_edit_prices),
      can_create_discounts: Boolean(can_create_discounts),
      can_issue_refunds: Boolean(can_issue_refunds),
      can_override_queue: can_override_queue !== undefined ? Boolean(can_override_queue) : true,
    }, admin.name);

    const { password_hash, ...safeAdmin } = newAdmin;
    return NextResponse.json({ success: true, admin: safeAdmin });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create admin' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
  }

  try {
    const { id, password, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });

    if (password && password.length >= 6) {
      updates.password_hash = hashPassword(password);
    }

    const updated = updateAdmin(id, updates, admin.name);
    if (!updated) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const { password_hash, ...safeAdmin } = updated;
    return NextResponse.json({ success: true, admin: safeAdmin });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });

  const success = deleteAdmin(id, admin.name);
  if (!success) {
    return NextResponse.json({ error: 'Cannot delete Super Admin account' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
