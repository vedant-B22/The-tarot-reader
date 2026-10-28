import { NextRequest, NextResponse } from 'next/server';
import { getTokenById, getLiveMetrics, getAllReaders, getSettings } from '@/lib/db';
import { calculateEstimatedWait } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tokenId = params.id;
  const token = getTokenById(tokenId);

  if (!token) {
    return NextResponse.json({ error: 'Token not found.' }, { status: 404 });
  }

  const metrics = getLiveMetrics();
  const readers = getAllReaders().filter(r => r.is_active);
  const settings = getSettings();

  const waitCalculation = calculateEstimatedWait(
    token.position,
    metrics.avgSessionMinutes,
    readers.length
  );

  return NextResponse.json({
    token: {
      id: token.id,
      token_number: token.token_number,
      token_display: token.token_display,
      status: token.status,
      position: token.position,
      focus_topic: token.focus_topic,
      custom_focus_text: token.custom_focus_text,
      assigned_reader_name: token.assigned_reader_name,
      called_at: token.called_at,
      session_started_at: token.session_started_at,
      session_ended_at: token.session_ended_at,
      actual_duration_seconds: token.actual_duration_seconds,
      service_name: token.service_name,
      service_duration: token.service_duration,
      service_cards: token.service_cards,
      payment_status: token.payment_status,
      payment_method: token.payment_method,
      final_amount_inr: token.final_amount_inr,
      cards_drawn: token.reading_summary_published ? token.cards_drawn : [],
      notes: token.reading_summary_published ? token.notes : null,
      reading_summary_published: token.reading_summary_published,
      customer_feedback_stars: token.customer_feedback_stars,
      created_at: token.created_at,
    },
    wait_estimate: waitCalculation,
    stall: {
      name: settings.stall_name,
      whatsapp: settings.whatsapp_helpline,
      is_queue_open: settings.is_queue_open,
    },
  });
}
