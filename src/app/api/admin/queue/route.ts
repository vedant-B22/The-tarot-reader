import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, checkAdminPermission } from '@/lib/auth';
import { 
  getAllQueueTokens, 
  getActiveQueueTokens, 
  getAllReaders, 
  getLiveMetrics, 
  getSettings, 
  updateTokenStatus, 
  setTokenPriority, 
  getReaderById,
  getTokenById 
} from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || undefined;

  const tokens = getAllQueueTokens(statusFilter);
  const activeTokens = getActiveQueueTokens();
  const readers = getAllReaders();
  const metrics = getLiveMetrics();
  const settings = getSettings();

  return NextResponse.json({
    tokens,
    activeTokens,
    readers,
    metrics,
    settings,
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, tokenId, readerId, reason, isPriority, notes, cardsDrawn, publishSummary } = body;

    if (action === 'call_next') {
      // Find the next waiting token (priority first, then sequential)
      const waiting = getActiveQueueTokens().filter(t => t.status === 'waiting');
      if (waiting.length === 0) {
        return NextResponse.json({ error: 'No waiting customers in the queue.' }, { status: 400 });
      }

      const nextToken = waiting[0];
      const reader = readerId ? getReaderById(readerId) : null;

      const updated = updateTokenStatus(nextToken.id, 'called', {
        assigned_reader_id: reader?.id || null,
        assigned_reader_name: reader?.name || 'Open Table',
      }, admin.name);

      broadcastRealtimeEvent('token_called', {
        tokenId: nextToken.id,
        tokenDisplay: nextToken.token_display,
        readerName: reader?.name || 'Stall Table',
      });

      return NextResponse.json({ success: true, token: updated });
    }

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required.' }, { status: 400 });
    }

    if (action === 'mark_in_session') {
      const reader = readerId ? getReaderById(readerId) : undefined;
      const updated = updateTokenStatus(tokenId, 'in_session', reader ? {
        assigned_reader_id: reader.id,
        assigned_reader_name: reader.name,
      } : undefined, admin.name);

      broadcastRealtimeEvent('queue_update', { tokenId, status: 'in_session' });
      return NextResponse.json({ success: true, token: updated });
    }

    if (action === 'complete_session') {
      const updated = updateTokenStatus(tokenId, 'completed', {
        notes: notes || null,
        cards_drawn: cardsDrawn || [],
        reading_summary_published: Boolean(publishSummary),
      }, admin.name);

      broadcastRealtimeEvent('queue_update', { tokenId, status: 'completed' });
      return NextResponse.json({ success: true, token: updated });
    }

    if (action === 'mark_noshow') {
      const updated = updateTokenStatus(tokenId, 'noshow', undefined, admin.name);
      broadcastRealtimeEvent('queue_update', { tokenId, status: 'noshow' });
      return NextResponse.json({ success: true, token: updated });
    }

    if (action === 'cancel') {
      const updated = updateTokenStatus(tokenId, 'cancelled', undefined, admin.name);
      broadcastRealtimeEvent('queue_update', { tokenId, status: 'cancelled' });
      return NextResponse.json({ success: true, token: updated });
    }

    if (action === 'requeue') {
      // Move back to waiting status
      const updated = updateTokenStatus(tokenId, 'waiting', {
        assigned_reader_id: null,
        assigned_reader_name: null,
      }, admin.name);
      broadcastRealtimeEvent('queue_update', { tokenId, status: 'waiting' });
      return NextResponse.json({ success: true, token: updated });
    }

    if (action === 'priority_bump') {
      if (!checkAdminPermission(admin, 'can_override_queue')) {
        return NextResponse.json({ error: 'Permission denied to override queue priority.' }, { status: 403 });
      }

      setTokenPriority(tokenId, Boolean(isPriority), reason || 'VIP priority granted by stall admin', admin.name);
      broadcastRealtimeEvent('queue_update', { tokenId, isPriority });
      return NextResponse.json({ success: true });
    }

    if (action === 'reassign_reader') {
      const reader = readerId ? getReaderById(readerId) : null;
      const updated = updateTokenStatus(tokenId, 'in_session', {
        assigned_reader_id: reader?.id || null,
        assigned_reader_name: reader?.name || null,
      }, admin.name);
      broadcastRealtimeEvent('queue_update', { tokenId, readerName: reader?.name });
      return NextResponse.json({ success: true, token: updated });
    }

    return NextResponse.json({ error: 'Invalid queue action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Queue action failed' }, { status: 500 });
  }
}
