import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
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
}
