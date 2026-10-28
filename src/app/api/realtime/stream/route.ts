import { NextRequest } from 'next/server';
import { subscribeToRealtime } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`));

      const unsubscribe = subscribeToRealtime((msg) => {
        try {
          controller.enqueue(encoder.encode(`event: ${msg.event}\ndata: ${JSON.stringify(msg.payload)}\n\n`));
        } catch (e) {
          unsubscribe();
        }
      });

      // Heartbeat ping every 15 seconds to keep connection alive on mobile networks
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
