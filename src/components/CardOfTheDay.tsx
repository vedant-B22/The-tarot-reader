'use client';

import { useState, useRef } from 'react';
import { TarotCard, getDailyCard, getRandomCard } from '@/lib/tarot-deck';
import { Sparkles, RefreshCw, Share2, Download, Flame, Moon, Compass, Heart, Shield, Check } from 'lucide-react';
import { playMysticalChime } from '@/lib/utils';

export default function CardOfTheDay() {
  const [card, setCard] = useState<TarotCard>(getDailyCard());
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleReveal = () => {
    if (!isFlipped) {
      playMysticalChime('bell');
      setIsFlipped(true);
      try {
        fetch('/api/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_key: 'card_of_the_day_reveal' }),
        });
      } catch {}
    }
  };

  const handleDrawNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      const next = getRandomCard();
      setCard(next);
      setTimeout(() => {
        setIsFlipped(true);
        playMysticalChime('bell');
      }, 300);
    }, 300);
  };

  // Generate Instagram Story Image (1080 x 1920)
  const generateInstagramStory = async () => {
    setIsGeneratingStory(true);
    try {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_key: 'instagram_story_share' }),
      });
    } catch {}

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsGeneratingStory(false);
      return;
    }

    // 1. Dark cosmic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#0a0314');
    bgGrad.addColorStop(0.35, '#190833');
    bgGrad.addColorStop(0.7, '#130424');
    bgGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative celestial stars
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    for (let i = 0; i < 90; i++) {
      const x = Math.sin(i * 99) * 540 + 540;
      const y = Math.cos(i * 33) * 960 + 960;
      const r = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Header badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ DAILY TAROT INSIGHT ✨', 540, 220);

    ctx.fillStyle = 'rgba(216, 180, 254, 0.85)';
    ctx.font = '28px sans-serif';
    ctx.fillText('THE ARCANE DIARIES • VEDANT BAVISKAR', 540, 280);

    // Card Graphic Box (Central Card)
    const cardX = 190;
    const cardY = 360;
    const cardW = 700;
    const cardH = 1100;
    const cardRadius = 40;

    // Card outer border glow
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 40;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.restore();

    // Card inner background
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    cardGrad.addColorStop(0, '#210c42');
    cardGrad.addColorStop(1, '#0e031f');
    ctx.fillStyle = cardGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Card inner decorative frame
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX + 24, cardY + 24, cardW - 48, cardH - 48);

    // Card Theme & Number
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`• ${card.arcana.toUpperCase()} • NO. ${card.number} •`, 540, 440);

    // Card Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px serif';
    ctx.fillText(card.name, 540, 540);

    // Keywords Pill
    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 28px sans-serif';
    ctx.fillText(card.keywords.join('  •  '), 540, 620);

    // Divider line
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.4)';
    ctx.beginPath();
    ctx.moveTo(300, 670);
    ctx.lineTo(780, 670);
    ctx.stroke();

    // Upright interpretation (wrapped)
    ctx.fillStyle = 'rgba(243, 232, 255, 0.95)';
    ctx.font = '34px serif';
    const words = card.upright.split(' ');
    let line = '';
    let curY = 750;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 600 && n > 0) {
        ctx.fillText(line, 540, curY);
        line = words[n] + ' ';
        curY += 48;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, curY);

    // Guidance callout box
    const boxY = curY + 60;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(250, boxY, 580, 180);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.strokeRect(250, boxY, 580, 180);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('🌟 TODAY\'S GUIDANCE', 540, boxY + 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 30px serif';
    ctx.fillText(`"${card.guidance}"`, 540, boxY + 115);

    // Affirmation
    ctx.fillStyle = 'rgba(216, 180, 254, 0.8)';
    ctx.font = '26px sans-serif';
    ctx.fillText(`Affirmation: "${card.affirmation}"`, 540, 1400);

    // Footer credits & CTA
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('🔮 Draw your free daily card at:', 540, 1600);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 42px sans-serif';
    ctx.fillText('tarot-reader-sspu.vercel.app', 540, 1660);

    ctx.fillStyle = 'rgba(216, 180, 254, 0.8)';
    ctx.font = '30px sans-serif';
    ctx.fillText('Instagram: @the_arcane_diaries • @this.is_vedant_12', 540, 1730);

    // Convert to blob and share/download
    canvas.toBlob(async (blob) => {
      setIsGeneratingStory(false);
      if (!blob) return;

      const file = new File([blob], `${card.name.replace(/\s+/g, '_')}_Daily_Tarot.png`, { type: 'image/png' });

      // Try native Web Share API (mobile devices)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `My Tarot Card of the Day: ${card.name}`,
            text: `Drawn from The Tarot Reader (@the_arcane_diaries). Clarity through the cards.`,
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
          return;
        } catch (e) {
          // User cancelled or share dismissed
        }
      }

      // Fallback: direct download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.name.replace(/\s+/g, '_')}_Daily_Tarot_Story.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }, 'image/png');
  };

  return (
    <div className="w-full max-w-xl mx-auto my-8 px-4">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Mystical Feature</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white">Your Card of the Day</h3>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-md mx-auto">
          Tap the sacred deck below to uncover today&apos;s cosmic guidance and affirmation.
        </p>
      </div>

      {/* Card 3D Flip Container */}
      <div 
        onClick={handleReveal}
        className="relative w-full max-w-xs sm:max-w-sm mx-auto h-[460px] sm:h-[500px] cursor-pointer perspective-1000 group select-none"
      >
        <div 
          className={`w-full h-full transition-transform duration-700 transform-style-3d relative ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Back Face (Hidden side before flip) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-[#1c0a37] via-[#290f4c] to-[#120524] border-2 border-amber-500/60 p-6 flex flex-col items-center justify-between shadow-2xl shadow-purple-950/80 group-hover:border-amber-400 transition-colors">
            {/* Corner ornaments */}
            <div className="w-full flex justify-between text-amber-400/60 text-xs font-mono">
              <span>✦</span>
              <span>✦</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border-2 border-amber-400/50 bg-black/40 flex items-center justify-center mb-4 shadow-inner shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Moon className="w-10 h-10 text-amber-400 fill-amber-400/20 animate-pulse" />
              </div>
              <h4 className="text-lg font-black text-white tracking-wider">TAP TO REVEAL</h4>
              <p className="text-xs text-purple-300/80 mt-1">Focus on a question or intention...</p>
            </div>

            <div className="w-full flex justify-between items-center text-amber-400/60 text-xs">
              <span>✦</span>
              <span className="font-mono text-[10px] tracking-widest text-amber-300/70">THE ARCANE DIARIES</span>
              <span>✦</span>
            </div>
          </div>

          {/* Card Front Face (Revealed side) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-b from-[#1b0933] via-[#120526] to-[#0a0217] border-2 border-amber-400 p-5 sm:p-6 flex flex-col justify-between shadow-2xl shadow-amber-500/20">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/90 mb-1">
                <span>{card.arcana.toUpperCase()}</span>
                <span>NO. {card.number}</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {card.name}
              </h4>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.keywords.map((kw, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Reading body */}
            <div className="my-2 space-y-2.5 text-left overflow-y-auto pr-1 text-xs">
              <p className="text-purple-100/95 leading-relaxed font-serif text-[13px]">
                {card.upright}
              </p>
              
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-0.5">Today&apos;s Guidance</p>
                <p className="text-xs text-amber-100 italic leading-snug">{card.guidance}</p>
              </div>

              <p className="text-[11px] text-purple-300/80 italic text-center">
                &ldquo;{card.affirmation}&rdquo;
              </p>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-2 border-t border-purple-800/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDrawNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-xs font-semibold transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Draw Another</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  generateInstagramStory();
                }}
                disabled={isGeneratingStory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold transition-all active:scale-95 shadow-md"
              >
                {shareSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Story Ready!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Story Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-purple-300/60 mt-3">
        {isFlipped ? 'Tap "Story Share" to generate a vertical 9:16 Instagram Story image!' : 'Tap the card deck above to flip and reveal'}
      </p>
    </div>
  );
}
