import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllLeadsSubscribers, toggleLeadOptOut, deleteLeadSubscriber, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leads = getAllLeadsSubscribers();
  return NextResponse.json({ leads });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, is_opted_out } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = toggleLeadOptOut(id, Boolean(is_opted_out));
    logAudit({
      admin_id: admin.id,
      admin_name: admin.name,
      action: 'UPDATE_LEAD_OPT_OUT',
      entity_type: 'lead',
      entity_id: id,
      new_values: JSON.stringify({ is_opted_out }),
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  deleteLeadSubscriber(id);
  logAudit({
    admin_id: admin.id,
    admin_name: admin.name,
    action: 'DELETE_LEAD_DATA_DPDP',
    entity_type: 'lead',
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
