import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { resetEvent } from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required for danger-zone event reset.' }, { status: 403 });
  }

  try {
    const { confirmation } = await req.json();

    if (confirmation !== 'RESET-EVENT-SSPU-CONFIRM') {
      return NextResponse.json({ 
        error: 'Confirmation string mismatch. You must type "RESET-EVENT-SSPU-CONFIRM" exactly to reset the live event.' 
      }, { status: 400 });
    }

    const success = resetEvent(confirmation, admin.name);
    if (!success) {
      return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }

    broadcastRealtimeEvent('event_reset');

    return NextResponse.json({ 
      success: true, 
      message: 'Event queue and payment transactions cleared. Settings and service menu preserved.' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset failed' }, { status: 500 });
  }
}
