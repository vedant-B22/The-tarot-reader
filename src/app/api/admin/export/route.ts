import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllCustomers, getAllPayments, getAllQueueTokens, getAuditLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

function toCsv(rows: any[], headers: string[]): string {
  const headerLine = headers.join(',');
  const lines = rows.map(r => 
    headers.map(h => {
      let val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [headerLine, ...lines].join('\n');
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'payments';

  let csvContent = '';
  let filename = `tarot_${type}_${Date.now()}.csv`;

  if (type === 'payments') {
    const payments = getAllPayments();
    csvContent = toCsv(payments, [
      'id', 'token_display', 'customer_name', 'customer_phone', 'service_name',
      'payment_method', 'status', 'base_amount_inr', 'discount_amount_inr',
      'referral_discount_inr', 'final_amount_inr', 'utr_number',
      'matched_with_bank_statement', 'verified_by_name', 'created_at'
    ]);
  } else if (type === 'customers') {
    const customers = getAllCustomers();
    csvContent = toCsv(customers, [
      'id', 'name', 'phone', 'course_year', 'referral_code', 'referral_credits_inr', 'total_readings', 'created_at'
    ]);
  } else if (type === 'tokens') {
    const tokens = getAllQueueTokens();
    csvContent = toCsv(tokens, [
      'id', 'token_display', 'customer_name', 'customer_phone', 'service_name',
      'focus_topic', 'status', 'is_priority', 'assigned_reader_name',
      'called_at', 'actual_duration_seconds', 'customer_feedback_stars',
      'customer_feedback_comment', 'created_at'
    ]);
  } else if (type === 'audit') {
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const logs = getAuditLogs(500);
    csvContent = toCsv(logs, [
      'id', 'admin_name', 'action', 'entity_type', 'entity_id', 'ip_address', 'created_at'
    ]);
  } else {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
