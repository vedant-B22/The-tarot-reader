import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllClickStats, getAllBookingRequests, getAllLeadsSubscribers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clicks = getAllClickStats();
  const bookings = getAllBookingRequests();
  const leads = getAllLeadsSubscribers();

  const totalClicks = clicks.reduce((acc, c) => acc + (c.click_count || 0), 0);

  return NextResponse.json({
    totalClicks,
    clicks,
    totalBookings: bookings.length,
    newBookings: bookings.filter(b => b.status === 'new').length,
    totalLeads: leads.length,
  });
}
