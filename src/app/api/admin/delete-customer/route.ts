import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { deleteCustomerData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required for data deletion.' }, { status: 403 });
  }

  try {
    const { customerId } = await req.json();
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
    }

    const deleted = deleteCustomerData(customerId, admin.name);
    if (!deleted) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Customer record and associated data deleted securely.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion failed' }, { status: 500 });
  }
}
