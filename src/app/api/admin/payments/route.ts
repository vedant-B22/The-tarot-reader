import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { 
  getAllPayments, 
  verifyPayment, 
  rejectPayment, 
  requestPaymentReupload, 
  toggleBankMatched,
  getPaymentById 
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

  const payments = getAllPayments(statusFilter);

  // Group and detect duplicates across the entire set
  const utrCounts: Record<string, number> = {};
  const hashCounts: Record<string, number> = {};

  payments.forEach(p => {
    if (p.utr_number) {
      const u = p.utr_number.trim().toUpperCase();
      utrCounts[u] = (utrCounts[u] || 0) + 1;
    }
    if (p.screenshot_hash) {
      hashCounts[p.screenshot_hash] = (hashCounts[p.screenshot_hash] || 0) + 1;
    }
  });

  const enrichedPayments = payments.map(p => ({
    ...p,
    has_duplicate_utr: Boolean(p.utr_number && utrCounts[p.utr_number.trim().toUpperCase()] > 1),
    has_duplicate_hash: Boolean(p.screenshot_hash && hashCounts[p.screenshot_hash] > 1),
  }));

  return NextResponse.json({ payments: enrichedPayments });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { action, paymentId, reason } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required.' }, { status: 400 });
    }

    if (action === 'verify') {
      const updated = verifyPayment(paymentId, admin.id, admin.name);
      broadcastRealtimeEvent('payment_verified', { paymentId });
      return NextResponse.json({ success: true, payment: updated });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required.' }, { status: 400 });
      }
      const updated = rejectPayment(paymentId, reason, admin.id, admin.name);
      broadcastRealtimeEvent('payment_rejected', { paymentId, reason });
      return NextResponse.json({ success: true, payment: updated });
    }

    if (action === 'request_reupload') {
      const updated = requestPaymentReupload(paymentId, reason || 'Unclear screenshot or mismatched UTR', admin.id, admin.name);
      broadcastRealtimeEvent('payment_reupload_requested', { paymentId });
      return NextResponse.json({ success: true, payment: updated });
    }

    if (action === 'toggle_matched') {
      const updated = toggleBankMatched(paymentId, admin.name);
      return NextResponse.json({ success: true, payment: updated });
    }

    return NextResponse.json({ error: 'Invalid payment action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment operation failed' }, { status: 500 });
  }
}
