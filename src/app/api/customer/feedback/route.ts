import { NextRequest, NextResponse } from 'next/server';
import { submitCustomerFeedback, getTokenById } from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { tokenId, stars, comment } = await req.json();

    if (!tokenId || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Valid tokenId and star rating (1-5) are required.' }, { status: 400 });
    }

    const token = getTokenById(tokenId);
    if (!token) {
      return NextResponse.json({ error: 'Token not found.' }, { status: 404 });
    }

    submitCustomerFeedback(tokenId, stars, comment);

    broadcastRealtimeEvent('feedback_submitted', { tokenId, stars });

    return NextResponse.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Feedback failed' }, { status: 500 });
  }
}
