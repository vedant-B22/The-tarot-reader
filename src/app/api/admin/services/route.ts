import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, checkAdminPermission } from '@/lib/auth';
import { getAllServices, createService, updateService, deleteService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') === 'true';
  const services = getAllServices(activeOnly);
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  if (!checkAdminPermission(admin, 'can_edit_prices')) {
    return NextResponse.json({ error: 'Permission denied: Cannot create or edit services/pricing.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const service = createService(body, admin.name);
    return NextResponse.json({ success: true, service });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create service' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  if (!checkAdminPermission(admin, 'can_edit_prices')) {
    return NextResponse.json({ error: 'Permission denied: Cannot edit services/pricing.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });

    const updated = updateService(id, updates, admin.name);
    return NextResponse.json({ success: true, service: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  if (!checkAdminPermission(admin, 'can_edit_prices')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Service ID required' }, { status: 400 });

  deleteService(id, admin.name);
  return NextResponse.json({ success: true });
}
