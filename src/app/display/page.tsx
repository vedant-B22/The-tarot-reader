'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Moon, 
  Users, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame, 
  BellRing 
} from 'lucide-react';
import { playMysticalChime } from '@/lib/utils';

export default function LiveDisplayScreen() {
  const [data, setData] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastCalledRef = useRef<string | null>(null);

  const fetchLiveDisplay = async () => {
    try {
      const res = await fetch('/api/admin/queue');
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // Check if any token newly called
        const calledTokens = (json.activeTokens || []).filter((t: any) => t.status === 'called');
        if (calledTokens.length > 0) {
          const latestCalled = calledTokens[0].token_display;
          if (lastCalledRef.current && lastCalledRef.current !== latestCalled && soundEnabled) {
            playMysticalChime('alert');
          }
          lastCalledRef.current = latestCalled;
        }
      }
    } catch (err) {
      console.warn('Display sync error:', err);
    }
  };

  useEffect(() => {
    fetchLiveDisplay();

    // SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');
      eventSource.addEventListener('token_called', () => {
        if (soundEnabled) playMysticalChime('alert');
        fetchLiveDisplay();
      });
      eventSource.addEventListener('queue_update', () => fetchLiveDisplay());
    } catch (e) {
      console.warn('SSE fallback to polling');
    }

    const interval = setInterval(fetchLiveDisplay, 5000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const readers = data?.readers || [];
  const activeTokens = data?.activeTokens || [];
  const settings = data?.settings || {};

  const waitingTokens = activeTokens.filter((t: any) => t.status === 'waiting');
  const calledOrInSessionTokens = activeTokens.filter((t: any) => t.status === 'called' || t.status === 'in_session');

  return (
    <div className="min-h-screen bg-[#07030e] text-white flex flex-col p-4 sm:p-8 select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-purple-900/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-purple-600 p-0.5 shadow-xl shadow-purple-900/50">
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
              <Moon className="w-7 h-7 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-amber-100 tracking-wide flex items-center gap-2">
              <span>{settings.stall_name || 'The Mystical Tarot'}</span>
              <span className="text-xs bg-purple-900/80 text-amber-300 px-2 py-0.5 rounded-full border border-purple-700/50 font-mono">
                SSPU LIVE
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80">
              {settings.theme_subtext || 'Live Reading Stall Queue'}
            </p>
          </div>
        </div>

        {/* Display Utility Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-gray-800 text-gray-500'
            }`}
            title="Toggle Chime Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-purple-800 bg-purple-950/40 text-purple-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Live Announcement Marquee Banner */}
      {settings.announcement_banner && (
        <div className="my-4 py-2 px-4 rounded-xl bg-purple-950/60 border border-amber-600/30 text-amber-200 text-sm font-semibold flex items-center gap-2 overflow-hidden shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
          <span className="truncate">{settings.announcement_banner}</span>
        </div>
      )}

      {/* Main Grid: NOW SERVING (Left) vs NEXT UP (Right) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
        {/* NOW SERVING SECTION (Takes 7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span>NOW SERVING</span>
            </h2>
            <span className="text-xs text-purple-300 font-mono">
              Proceed to your table when your token flashes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {readers.length === 0 ? (
              <div className="col-span-2 rounded-3xl bg-black/40 border border-purple-900/40 flex items-center justify-center p-8 text-center text-purple-300/60">
                Readers are setting up tables...
              </div>
            ) : (
              readers.map((reader: any) => {
                // Find token assigned to this reader
                const currentServing = calledOrInSessionTokens.find((t: any) => t.assigned_reader_id === reader.id);

                return (
                  <div
                    key={reader.id}
                    className={`rounded-3xl p-6 flex flex-col justify-between border-2 transition-all ${
                      currentServing?.status === 'called'
                        ? 'border-amber-400 bg-gradient-to-b from-amber-950/60 to-purple-950/80 shadow-2xl shadow-amber-500/20 animate-pulse'
                        : currentServing
                        ? 'border-purple-600 bg-[#140b29] shadow-xl'
                        : 'border-purple-900/40 bg-black/40 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                          {reader.name}
                        </span>
                        {currentServing?.status === 'called' ? (
                          <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded-full animate-bounce">
                            Calling Now
                          </span>
                        ) : currentServing ? (
                          <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                            In Session
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 uppercase">
                            Available
                          </span>
                        )}
                      </div>

                      {currentServing ? (
                        <div className="text-center py-6">
                          <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 font-mono tracking-tight">
                            {currentServing.token_display}
                          </div>
                          <div className="text-xs font-bold text-amber-200/80 mt-2 uppercase tracking-widest">
                            {currentServing.service_name}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-purple-300/40 text-sm font-semibold">
                          Table Ready
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-purple-900/30 text-[11px] text-purple-300/70 flex justify-between">
                      <span>Reader Active</span>
                      <span>{currentServing ? 'Reading in progress' : 'Waiting for next'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* NEXT UP QUEUE SECTION (Takes 5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-purple-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>UP NEXT IN LINE</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-amber-300 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{waitingTokens.length} Waiting</span>
            </div>
          </div>

          <div className="flex-1 rounded-3xl bg-[#120824] border border-purple-900/50 p-4 sm:p-5 flex flex-col justify-start overflow-y-auto space-y-3 max-h-[550px]">
            {waitingTokens.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-purple-300/50">
                <Moon className="w-10 h-10 text-purple-700 mb-2" />
                <p className="text-sm font-semibold">Queue is clear!</p>
                <p className="text-xs text-purple-400/60 mt-1">Scan the QR code to join immediately.</p>
              </div>
            ) : (
              waitingTokens.slice(0, 8).map((t: any, idx: number) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                    idx === 0
                      ? 'bg-purple-900/50 border-amber-400/60 shadow-lg'
                      : 'bg-black/40 border-purple-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-xs font-black text-amber-300">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-mono font-black text-xl text-amber-200 tracking-wide">
                        {t.token_display}
                      </div>
                      <div className="text-[11px] text-purple-300/80">
                        {t.service_name}
                      </div>
                    </div>
                  </div>

                  {idx === 0 && (
                    <span className="text-[10px] font-black uppercase bg-amber-400 text-black px-2 py-1 rounded-lg animate-pulse">
                      Preparing Next
                    </span>
                  )}
                </div>
              ))
            )}

            {waitingTokens.length > 8 && (
              <div className="text-center text-xs text-purple-400/80 pt-2 font-mono">
                + {waitingTokens.length - 8} more customers in queue
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding for Stall Display */}
      <footer className="pt-4 border-t border-purple-900/40 flex items-center justify-between text-xs text-purple-300/60 font-mono">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-time stall queue synchronized</span>
        </div>
        <div>
          Scan QR at Stall Table to Register
        </div>
      </footer>
    </div>
  );
}
