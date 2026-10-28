// Lightweight, ultra-reliable in-memory SSE event emitter for live updates
// Works seamlessly in single-process, local testing, and multi-client environments

type EventCallback = (data: any) => void;
const subscribers = new Set<EventCallback>();

export function subscribeToRealtime(callback: EventCallback): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function broadcastRealtimeEvent(event: string, payload: any = {}) {
  const message = { event, payload, timestamp: Date.now() };
  subscribers.forEach(cb => {
    try {
      cb(message);
    } catch (e) {
      console.warn('Realtime subscriber error:', e);
    }
  });
}
