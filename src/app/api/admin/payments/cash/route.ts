import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, checkAdminPermission } from '@/lib/auth';
import { recordCashReceived, issueRefund, getPaymentById } from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { action, paymentId, cashAmountGiven, refundReason } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required.' }, { status: 400 });
    }

    if (action === 'record_cash') {
      const payment = getPaymentById(paymentId);
      if (!payment) {
        return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
      }

      const cashGiven = Number(cashAmountGiven) || payment.final_amount_inr;
      const updated = recordCashReceived(paymentId, cashGiven, admin.id, admin.name);

      broadcastRealtimeEvent('payment_verified', { paymentId });

      return NextResponse.json({
        success: true,
        payment: updated,
        changeReturned: Math.max(0, cashGiven - payment.final_amount_inr),
      });
    }

    if (action === 'issue_refund') {
      if (!checkAdminPermission(admin, 'can_issue_refunds')) {
        return NextResponse.json({ error: 'Permission denied: You do not have rights to issue refunds.' }, { status: 403 });
      }

      if (!refundReason || refundReason.trim().length < 3) {
        return NextResponse.json({ error: 'A mandatory refund reason is required for audit logs.' }, { status: 400 });
      }

      const updated = issueRefund(paymentId, refundReason.trim(), admin.id, admin.name);
      broadcastRealtimeEvent('payment_refunded', { paymentId });

      return NextResponse.json({ success: true, payment: updated });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Cash operation failed' }, { status: 500 });
  }
}
