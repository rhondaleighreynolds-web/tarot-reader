import type { SpreadConfig, SpreadType } from '../types/tarot';
import { getPriceLabel, isPaidSpread } from '../lib/paymentConfig';

export const SPREADS: SpreadConfig[] = [
  {
    type: 'single',
    label: 'Single Card',
    count: 1,
    positions: ['The Present'],
    description: "One card — a single clear message for now.",
  },
  {
    type: 'three',
    label: 'Past · Present · Future',
    count: 3,
    positions: ['Past', 'Present', 'Future'],
    description: 'Three cards tracing the arc of your situation.',
  },
  {
    type: 'celtic',
    label: 'Five-Card Cross',
    count: 5,
    positions: ['Situation', 'Challenge', 'Subconscious', 'Advice', 'Outcome'],
    description: 'A deeper reading of all the forces at play.',
  },
];

interface SpreadSelectorProps {
  selected: SpreadType;
  onSelect: (spread: SpreadConfig) => void;
}

export function SpreadSelector({ selected, onSelect }: SpreadSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <p
        className="font-sans uppercase"
        style={{ fontSize: 9, letterSpacing: '0.35em', color: 'rgba(180,140,45,0.42)' }}
      >
        Choose your spread
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {SPREADS.map((spread) => {
          const isActive = selected === spread.type;
          const paid = isPaidSpread(spread.type);
          const price = getPriceLabel(spread.type);

          return (
            <button
              key={spread.type}
              onClick={() => onSelect(spread)}
              className="relative group text-left transition-all duration-300"
              style={{
                minWidth: 172,
                padding: '14px 18px 16px',
                borderRadius: 6,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(38,16,72,0.70) 0%, rgba(55,22,98,0.75) 100%)'
                  : 'linear-gradient(135deg, rgba(28,16,8,0.60) 0%, rgba(18,10,5,0.65) 100%)',
                border: isActive
                  ? '1px solid rgba(120,55,210,0.48)'
                  : '1px solid rgba(160,115,35,0.20)',
                boxShadow: isActive
                  ? '0 4px 20px rgba(80,20,160,0.22), inset 0 1px 0 rgba(140,70,220,0.10)'
                  : 'none',
              }}
            >
              {isActive && (
                <div
                  className="absolute inset-x-0 top-0 h-px rounded-t"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(160,90,240,0.50), transparent)',
                  }}
                />
              )}

              {/* Name row */}
              <p
                className="font-serif font-semibold leading-tight"
                style={{
                  fontSize: 13,
                  color: isActive ? 'rgba(220,195,255,0.92)' : 'rgba(210,185,140,0.82)',
                  marginBottom: 5,
                }}
              >
                {spread.label}
              </p>

              {/* Description */}
              <p
                className="font-sans leading-relaxed"
                style={{ fontSize: 11, color: 'rgba(130,105,65,0.65)', marginBottom: 12 }}
              >
                {spread.description}
              </p>

              {/* Price — prominent, bottom of card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 5,
                  background: paid
                    ? 'rgba(120,75,10,0.35)'
                    : 'rgba(15,60,20,0.40)',
                  border: paid
                    ? '1px solid rgba(200,145,40,0.30)'
                    : '1px solid rgba(60,160,70,0.30)',
                }}
              >
                <span
                  style={{
                    fontSize: paid ? 17 : 15,
                    fontWeight: 700,
                    letterSpacing: paid ? '0.01em' : '0.04em',
                    color: paid
                      ? 'rgba(240,190,60,0.97)'
                      : 'rgba(100,210,100,0.97)',
                    fontFamily: paid ? 'inherit' : 'sans-serif',
                  }}
                >
                  {price}
                </span>
                {paid && (
                  <span
                    className="font-sans"
                    style={{ fontSize: 10, color: 'rgba(180,140,50,0.60)', letterSpacing: '0.06em' }}
                  >
                    via Stripe
                  </span>
                )}
              </div>

              {isActive && (
                <div
                  className="absolute top-2.5 right-2.5 rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: 'rgba(180,100,255,0.75)',
                    boxShadow: '0 0 6px rgba(180,100,255,0.6)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
