import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAuditLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required to view audit logs.' }, { status: 403 });
  }

  const logs = getAuditLogs(150);
  return NextResponse.json({ logs });
}
