import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllBookingRequests, updateBookingStatus, deleteBookingRequest, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || 'all';

  const bookings = getAllBookingRequests(statusFilter);
  return NextResponse.json({ bookings });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status, admin_notes } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const updated = updateBookingStatus(id, status, admin_notes);
    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'UPDATE_BOOKING_STATUS',
      entity_type: 'booking',
      entity_id: id,
      new_values: JSON.stringify({ status, admin_notes }),
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin required to delete bookings' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  deleteBookingRequest(id);
  logAudit({
    admin_id: admin.id,
    admin_name: admin.name,
    action: 'DELETE_BOOKING_REQUEST',
    entity_type: 'booking',
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
