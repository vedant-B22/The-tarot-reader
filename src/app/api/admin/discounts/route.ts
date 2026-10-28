import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, checkAdminPermission } from '@/lib/auth';
import { getAllDiscountCodes, createDiscountCode, updateDiscountCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  const discounts = getAllDiscountCodes();
  return NextResponse.json({ discounts });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  if (!checkAdminPermission(admin, 'can_create_discounts')) {
    return NextResponse.json({ error: 'Permission denied: Cannot create discount codes.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const discount = createDiscountCode({
      ...body,
      created_by_admin_id: admin.id,
    }, admin.name);

    return NextResponse.json({ success: true, discount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create discount code' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  if (!checkAdminPermission(admin, 'can_create_discounts')) {
    return NextResponse.json({ error: 'Permission denied: Cannot modify discount codes.' }, { status: 403 });
  }

  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Discount code ID is required' }, { status: 400 });

    const updated = updateDiscountCode(id, updates, admin.name);
    return NextResponse.json({ success: true, discount: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update discount code' }, { status: 500 });
  }
}
