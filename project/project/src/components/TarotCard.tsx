import { useState, useEffect, useRef, useCallback } from 'react';
import type { DrawnCard } from '../types/tarot';

/* ── Card rotation by position (gives laid-down look) ────── */
const ROTATIONS = [-3.8, 2.2, -1.4, 3.6, -2.1];

/* ── Suit display data ───────────────────────────────────── */
const SUIT_GLYPH: Record<string, string> = {
  Wands: '⁕', Cups: '◈', Swords: '✦', Pentacles: '⬡',
};
const SUIT_ACCENT: Record<string, { label: string; glyph: string; borderCol: string; bgGrad: string }> = {
  Wands: {
    label: 'text-amber-400/70',
    glyph: 'text-amber-600/45',
    borderCol: 'rgba(180,110,20,0.45)',
    bgGrad: 'linear-gradient(160deg, #1f0e05 0%, #140a03 100%)',
  },
  Cups: {
    label: 'text-blue-300/70',
    glyph: 'text-blue-500/40',
    borderCol: 'rgba(40,80,160,0.45)',
    bgGrad: 'linear-gradient(160deg, #050d1e 0%, #030812 100%)',
  },
  Swords: {
    label: 'text-slate-300/70',
    glyph: 'text-slate-400/40',
    borderCol: 'rgba(100,110,130,0.4)',
    bgGrad: 'linear-gradient(160deg, #0d0e10 0%, #080a0c 100%)',
  },
  Pentacles: {
    label: 'text-emerald-400/70',
    glyph: 'text-emerald-600/40',
    borderCol: 'rgba(30,110,60,0.45)',
    bgGrad: 'linear-gradient(160deg, #050f08 0%, #030b05 100%)',
  },
  Major: {
    label: 'text-amber-300/70',
    glyph: 'text-amber-500/35',
    borderCol: 'rgba(180,130,40,0.50)',
    bgGrad: 'linear-gradient(160deg, #130d05 0%, #0c0803 100%)',
  },
};

/* ── Smoke configuration ─────────────────────────────────── */
const SMOKE_PUFFS = [
  { left: '8%',  bottom: '28%', w: 80,  h: 80,  variant: 'a', delay: 0 },
  { left: '35%', bottom: '22%', w: 100, h: 100, variant: 'b', delay: 0.07 },
  { left: '60%', bottom: '30%', w: 85,  h: 85,  variant: 'c', delay: 0.04 },
  { left: '20%', bottom: '46%', w: 92,  h: 92,  variant: 'd', delay: 0.16 },
  { left: '52%', bottom: '44%', w: 70,  h: 70,  variant: 'a', delay: 0.22 },
  { left: '-5%', bottom: '38%', w: 65,  h: 65,  variant: 'b', delay: 0.30 },
  { left: '72%', bottom: '42%', w: 88,  h: 88,  variant: 'c', delay: 0.11 },
  { left: '42%', bottom: '55%', w: 58,  h: 58,  variant: 'd', delay: 0.26 },
  { left: '15%', bottom: '60%', w: 72,  h: 72,  variant: 'a', delay: 0.34 },
  { left: '65%', bottom: '55%', w: 60,  h: 60,  variant: 'b', delay: 0.40 },
];

interface Props {
  drawnCard: DrawnCard;
  index: number;
  /** count of cards in spread — used to size the card */
  total: number;
  onReveal: () => void;
}

export function TarotCard({ drawnCard, index, total, onReveal }: Props) {
  const { card, orientation, position, revealed } = drawnCard;
  const reading = orientation === 'upright' ? card.upright : card.reversed;
  const suitKey = card.suit ?? 'Major';
  const accent = SUIT_ACCENT[suitKey];
  const rotation = ROTATIONS[index % ROTATIONS.length];

  /* ── Reveal animation state ─────────────── */
  const [smokeActive, setSmokeActive] = useState(false);
  const [faceVisible, setFaceVisible] = useState(revealed);
  const [contentIn, setContentIn] = useState(revealed);
  const [animating, setAnimating] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* If parent force-reveals (e.g. "reveal all"), skip animation */
  useEffect(() => {
    if (revealed && !faceVisible && !animating) {
      setFaceVisible(true);
      setContentIn(true);
    }
  }, [revealed, faceVisible, animating]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  function handleClick() {
    if (revealed || animating) return;
    setAnimating(true);
    setSmokeActive(true);

    addTimer(() => setFaceVisible(true),   600);   // flip starts mid-smoke
    addTimer(() => setSmokeActive(false), 1400);   // smoke clears
    addTimer(() => setContentIn(true),    1500);   // text fades in
    addTimer(() => { setAnimating(false); onReveal(); }, 1600);
  }

  /* ── Card sizing based on spread count ─── */
  const cardW = total >= 5 ? 100 : total >= 4 ? 112 : 130;
  const cardH = Math.round(cardW * 1.75);

  return (
    <div
      className="flex flex-col items-center gap-2 fade-up"
      style={{ animationDelay: `${index * 0.13}s` }}
    >
      {/* Position label */}
      <p
        className="text-[9px] uppercase tracking-[0.22em] font-sans"
        style={{ color: 'rgba(200,160,50,0.5)' }}
      >
        {position}
      </p>

      {/* Card wrapper: rotation + shadow give physical presence */}
      <div
        className={`relative card-scene ${!revealed && !animating ? 'cursor-pointer group' : ''}`}
        style={{
          width: cardW,
          height: cardH,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'bottom center',
        }}
        onClick={handleClick}
      >
        {/* ── Smoke particles ──────────────────── */}
        {smokeActive && (
          <div className="smoke-wrap absolute inset-0 overflow-visible" style={{ zIndex: 20 }}>
            {SMOKE_PUFFS.map((p, i) => (
              <div
                key={i}
                className={`smoke-puff smoke-puff-${p.variant}`}
                style={{
                  left: p.left,
                  bottom: p.bottom,
                  width: p.w,
                  height: p.h,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Physical card shadow (behind the flipper) ───── */}
        <div
          className="card-physical absolute rounded-[10px]"
          style={{ inset: 0, zIndex: 1 }}
        />

        {/* ── 3-D Flipper ─────────────────────────────────── */}
        <div
          className={`card-flipper absolute inset-0 ${faceVisible ? 'flipped' : ''}`}
          style={{ zIndex: 2 }}
        >
          {/* BACK ─────────────────────────────────────────── */}
          <div
            className="card-back"
            style={{
              background: 'linear-gradient(145deg, #1c1008 0%, #100905 50%, #1c1008 100%)',
              boxShadow: `0 0 0 1px rgba(180,130,40,0.55)`,
            }}
          >
            {/* Crosshatch pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg,
                    rgba(180,130,40,0.10) 0px, rgba(180,130,40,0.10) 1px,
                    transparent 1px, transparent 9px),
                  repeating-linear-gradient(-45deg,
                    rgba(180,130,40,0.07) 0px, rgba(180,130,40,0.07) 1px,
                    transparent 1px, transparent 9px)`,
              }}
            />
            {/* Inset border */}
            <div
              className="absolute rounded-lg"
              style={{
                inset: 8,
                border: '1px solid rgba(180,130,40,0.22)',
              }}
            />
            <div
              className="absolute rounded-md"
              style={{
                inset: 14,
                border: '1px solid rgba(180,130,40,0.12)',
              }}
            />
            {/* Centre star */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  border: '1px solid rgba(180,130,40,0.30)',
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    border: '1px solid rgba(180,130,40,0.18)',
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: 'rgba(180,130,40,0.42)' }} fill="currentColor">
                    <path d="M12 1.5L13.8 9.8L22 12L13.8 14.2L12 22.5L10.2 14.2L2 12L10.2 9.8Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </div>
              </div>
              <p
                className="font-sans uppercase tracking-[0.28em]"
                style={{ fontSize: 7, color: 'rgba(180,130,40,0.28)' }}
              >
                Arcana
              </p>
            </div>

            {/* Hover shimmer */}
            {!revealed && !animating && (
              <div
                className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(200,160,50,0.08) 0%, transparent 70%)',
                }}
              />
            )}
          </div>

          {/* FACE ─────────────────────────────────────────── */}
          <div
            className="card-face"
            style={{
              background: accent.bgGrad,
              boxShadow: `0 0 0 1px ${accent.borderCol}`,
            }}
          >
            {/* Inner frame */}
            <div
              className="absolute rounded-lg"
              style={{
                inset: 6,
                border: `1px solid ${accent.borderCol}`,
                opacity: 0.6,
              }}
            />

            {/* Top/bottom gold lines */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent.borderCol}, transparent)` }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent.borderCol}, transparent)` }}
            />

            {contentIn ? (
              <div className="card-content-reveal absolute inset-0 flex flex-col px-3 py-3">
                {/* Header row */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-mono"
                    style={{ fontSize: 9, color: 'rgba(180,140,50,0.55)' }}
                  >
                    {card.arcana === 'Major'
                      ? String(card.number).padStart(2, '0')
                      : suitKey[0]}
                  </span>
                  <span
                    className={`${accent.glyph}`}
                    style={{ fontSize: 11 }}
                  >
                    {card.suit ? (SUIT_GLYPH[card.suit] ?? '●') : '☽'}
                  </span>
                </div>

                {/* Central glyph */}
                <div className="flex-1 flex items-center justify-center">
                  <span
                    className={`${accent.glyph} select-none`}
                    style={{
                      fontSize: 40,
                      opacity: 0.35,
                      transform: orientation === 'reversed' ? 'rotate(180deg)' : 'none',
                      display: 'inline-block',
                    }}
                  >
                    {card.suit ? (SUIT_GLYPH[card.suit] ?? '●') : '☽'}
                  </span>
                </div>

                {/* Card footer */}
                <div>
                  <div
                    className="mb-2"
                    style={{
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${accent.borderCol}, transparent)`,
                    }}
                  />
                  <p
                    className="font-serif font-semibold leading-tight"
                    style={{ fontSize: total >= 5 ? 9 : 10, color: 'rgba(220,190,130,0.90)' }}
                  >
                    {card.name}
                  </p>
                  <p
                    className="font-sans uppercase tracking-[0.15em] mt-0.5"
                    style={{
                      fontSize: 7,
                      color: orientation === 'upright'
                        ? 'rgba(200,160,50,0.55)'
                        : 'rgba(170,100,220,0.60)',
                    }}
                  >
                    {orientation === 'upright' ? '↑ Upright' : '↓ Reversed'}
                  </p>
                  {/* Keywords */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {reading.keywords.slice(0, total >= 5 ? 1 : 2).map((kw) => (
                      <span
                        key={kw}
                        className="font-sans rounded"
                        style={{
                          fontSize: 7,
                          padding: '1px 5px',
                          background: 'rgba(0,0,0,0.35)',
                          color: 'rgba(200,170,90,0.55)',
                          border: `1px solid rgba(180,140,40,0.18)`,
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Blank face until content fades in */
              <div className="absolute inset-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
