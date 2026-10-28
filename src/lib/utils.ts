import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return '--';
  }
}

export function formatTimeOnly(isoString: string | null | undefined): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '--';
  }
}

export function generateUpiUrl(params: {
  pa: string;
  pn: string;
  am: number;
  tn?: string;
}): string {
  const pa = encodeURIComponent(params.pa.trim());
  const pn = encodeURIComponent(params.pn.trim());
  const am = params.am.toFixed(2);
  const tn = encodeURIComponent(params.tn || 'Tarot Reading');
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export function calculateEstimatedWait(
  position: number,
  avgSessionMinutes: number | null,
  activeReaderCount: number
): { minutes: number | null; label: string } {
  if (position <= 1) {
    return { minutes: 0, label: 'Up next!' };
  }
  if (!avgSessionMinutes || avgSessionMinutes <= 0) {
    return { minutes: null, label: 'Calculating (needs live readings)...' };
  }
  const readers = Math.max(1, activeReaderCount);
  const estimated = Math.ceil(((position - 1) / readers) * avgSessionMinutes);
  return { minutes: estimated, label: `~${estimated} mins` };
}

// -------------------------------------------------------------
// WEB AUDIO SYNTHESIZER (Pure JS mystical chimes - zero MP3 downloads)
// -------------------------------------------------------------
export function playMysticalChime(type: 'bell' | 'alert' | 'success' = 'bell') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'bell') {
      // Mystical Tibetan Singing Bowl / Chime Harmonic Sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz Love/Destiny frequency
      osc2.frequency.setValueAtTime(1056, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.5);
      osc2.stop(ctx.currentTime + 2.5);
    } else if (type === 'alert') {
      // High alert ping when called
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } else if (type === 'success') {
      // Pentatonic celebratory chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.8);
      });
    }
  } catch (err) {
    console.warn('Web Audio chime not supported or muted:', err);
  }
}

// -------------------------------------------------------------
// CLIENT-SIDE IMAGE COMPRESSOR
// Compress screenshots to ~80-150KB for rapid 4G upload
// -------------------------------------------------------------
export async function compressImage(file: File, maxDim = 1200, quality = 0.75): Promise<{ blob: Blob; hash: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Blob conversion failed'));
              return;
            }

            // Compute SHA-256 hash in browser
            const buffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            resolve({ blob, hash: hashHex });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image into DOM'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
