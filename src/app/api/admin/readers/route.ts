import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllReaders, createReader, updateReader } from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readers = getAllReaders();
  return NextResponse.json({ readers });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Reader/Table name is required' }, { status: 400 });
    }

    const reader = createReader(name, admin.name);
    broadcastRealtimeEvent('readers_updated');
    return NextResponse.json({ success: true, reader });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create reader' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Reader ID is required' }, { status: 400 });

    const reader = updateReader(id, updates, admin.name);
    broadcastRealtimeEvent('readers_updated');
    return NextResponse.json({ success: true, reader });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update reader' }, { status: 500 });
  }
}
