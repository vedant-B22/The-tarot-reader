import { NextRequest, NextResponse } from 'next/server';
import { updateTokenStatus, getTokenById } from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { tokenId } = await req.json();

    const token = getTokenById(tokenId);
    if (!token) {
      return NextResponse.json({ error: 'Token not found.' }, { status: 404 });
    }

    if (token.status !== 'waiting') {
      return NextResponse.json({ error: 'Only waiting tokens can be cancelled.' }, { status: 400 });
    }

    updateTokenStatus(tokenId, 'cancelled', undefined, 'Customer Self-Cancellation');
    broadcastRealtimeEvent('queue_update', { tokenId, status: 'cancelled' });

    return NextResponse.json({ success: true, message: 'Queue token has been cancelled.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Cancellation failed' }, { status: 500 });
  }
}
