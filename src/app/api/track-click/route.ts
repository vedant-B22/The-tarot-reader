import { NextRequest, NextResponse } from 'next/server';
import { incrementClickStat } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { event_key } = await req.json();
    if (!event_key || typeof event_key !== 'string') {
      return NextResponse.json({ error: 'Invalid event key' }, { status: 400 });
    }

    const safeKey = event_key.trim().slice(0, 50);
    incrementClickStat(safeKey);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
