import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DrawnCard } from '../types/tarot';

const SUIT_MARK: Record<string, string> = {
  Wands: '⁕', Cups: '◈', Swords: '✦', Pentacles: '⬡',
};

interface CardReadingProps {
  drawnCard: DrawnCard;
  index: number;
}

export function CardReading({ drawnCard, index }: CardReadingProps) {
  const [open, setOpen] = useState(index === 0);
  const { card, orientation, position } = drawnCard;
  const reading = orientation === 'upright' ? card.upright : card.reversed;
  const isUpright = orientation === 'upright';

  return (
    <div
      className="overflow-hidden rounded-sm"
      style={{
        background: 'linear-gradient(160deg, rgba(20,12,6,0.96) 0%, rgba(13,8,4,0.98) 100%)',
        border: '1px solid rgba(160,115,35,0.20)',
        boxShadow: 'inset 0 1px 0 rgba(160,115,35,0.08)',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Orientation bar */}
          <div
            className="flex-shrink-0 rounded-full"
            style={{
              width: 3,
              height: 38,
              background: isUpright
                ? 'linear-gradient(180deg, rgba(210,160,40,0.7) 0%, rgba(180,120,25,0.4) 100%)'
                : 'linear-gradient(180deg, rgba(140,70,210,0.7) 0%, rgba(100,45,170,0.4) 100%)',
            }}
          />
          <div className="min-w-0">
            <p
              className="font-sans uppercase"
              style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(160,120,40,0.5)', marginBottom: 2 }}
            >
              {position}
            </p>
            <p
              className="font-serif font-semibold leading-snug truncate"
              style={{ fontSize: 14, color: 'rgba(230,210,170,0.92)' }}
            >
              {card.arcana === 'Minor' && card.suit ? SUIT_MARK[card.suit] + ' ' : '☽ '}
              {card.name}
            </p>
          </div>
          <span
            className="flex-shrink-0 font-sans uppercase rounded-full"
            style={{
              fontSize: 8,
              letterSpacing: '0.18em',
              padding: '2px 8px',
              border: isUpright
                ? '1px solid rgba(190,140,40,0.28)'
                : '1px solid rgba(140,70,210,0.28)',
              color: isUpright ? 'rgba(200,155,50,0.65)' : 'rgba(160,90,240,0.65)',
              background: isUpright ? 'rgba(180,130,30,0.08)' : 'rgba(120,50,200,0.10)',
            }}
          >
            {orientation}
          </span>
        </div>
        <div className="flex-shrink-0 ml-3">
          {open
            ? <ChevronUp  style={{ width: 13, height: 13, color: 'rgba(160,120,40,0.45)' }} />
            : <ChevronDown style={{ width: 13, height: 13, color: 'rgba(100,80,30,0.45)' }} className="group-hover:text-amber-600/50 transition-colors" />
          }
        </div>
      </button>

      {open && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: '1px solid rgba(160,115,35,0.10)' }}
        >
          {/* Keywords */}
          <div className="flex flex-wrap gap-1.5 pt-4 mb-4">
            {reading.keywords.map((kw) => (
              <span
                key={kw}
                className="font-sans rounded-full"
                style={{
                  fontSize: 10,
                  padding: '2px 10px',
                  background: 'rgba(18,10,4,0.7)',
                  color: 'rgba(200,160,60,0.60)',
                  border: '1px solid rgba(170,120,35,0.18)',
                }}
              >
                {kw}
              </span>
            ))}
          </div>

          <div className="space-y-3.5">
            <ReadRow label="Theme"   text={reading.theme} />
            <ReadRow label="Shadow"  text={reading.shadow}  accent="#9060d0" />
            <ReadRow label="Reframe" text={reading.reframe} accent="#4090c0" />
            <ReadRow label="Advice"  text={reading.advice}  accent="#c09030" />
          </div>

          <div
            className="mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(160,115,35,0.10)' }}
          >
            <p
              className="font-serif italic leading-relaxed"
              style={{ fontSize: 13, color: 'rgba(180,155,110,0.75)' }}
            >
              {reading.closing}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadRow({ label, text, accent = 'rgba(140,110,40,0.5)' }: { label: string; text: string; accent?: string }) {
  return (
    <div>
      <p
        className="font-sans uppercase mb-1"
        style={{ fontSize: 9, letterSpacing: '0.22em', color: accent, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="font-sans leading-relaxed"
        style={{ fontSize: 13, color: 'rgba(200,180,140,0.85)' }}
      >
        {text}
      </p>
    </div>
  );
}
