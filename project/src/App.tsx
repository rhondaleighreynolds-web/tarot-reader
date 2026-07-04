import { useState, useCallback, useEffect } from 'react';
import type { DrawnCard, ReadingSummary, SpreadConfig, SpreadType } from './types/tarot';
import { tarotDeck } from './data/tarotDeck';
import { buildLocalSummary } from './lib/hybridEngine';
import { isPaidSpread, getPriceLabel } from './lib/paymentConfig';
import { TarotCard } from './components/TarotCard';
import { SpreadSelector, SPREADS } from './components/SpreadSelector';
import { CardReading } from './components/CardReading';
import { ReadingSummaryPanel } from './components/ReadingSummaryPanel';
import { Shuffle, RotateCcw, Eye, BookOpen, CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';

type AppPhase = 'select' | 'draw' | 'reading' | 'summary';
type PaymentBanner = 'success' | 'cancelled' | 'failed' | null;

function drawCards(spread: SpreadConfig): DrawnCard[] {
  const shuffled = [...tarotDeck].sort(() => Math.random() - 0.5);
  return spread.positions.map((position, i) => ({
    card: shuffled[i],
    orientation: Math.random() < 0.72 ? 'upright' : 'reversed',
    position,
    revealed: false,
  }));
}

/* ── Gold ornamental divider ──────────────────────────────── */
function GoldDivider() {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(170,120,35,0.22))' }}
      />
      <svg viewBox="0 0 16 16" style={{ width: 10, height: 10, color: 'rgba(170,120,35,0.32)', flexShrink: 0 }} fill="currentColor">
        <path d="M8 0.5L9.3 6.7L15.5 8L9.3 9.3L8 15.5L6.7 9.3L0.5 8L6.7 6.7Z" />
      </svg>
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, rgba(170,120,35,0.22), transparent)' }}
      />
    </div>
  );
}

/* ── Gold button ──────────────────────────────────────────── */
function GoldButton({
  onClick, disabled = false, children,
}: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-2.5 font-sans font-medium tracking-wide transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        fontSize: 13,
        padding: '11px 28px',
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(130,85,18,0.65) 0%, rgba(90,55,10,0.72) 100%)',
        border: '1px solid rgba(185,135,40,0.48)',
        color: 'rgba(225,185,75,0.92)',
        boxShadow: '0 4px 20px rgba(110,70,8,0.28), inset 0 1px 0 rgba(220,175,70,0.14)',
      }}
    >
      {children}
    </button>
  );
}

/* ── Violet button ────────────────────────────────────────── */
function VioletButton({
  onClick, disabled = false, children,
}: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-2.5 font-sans font-medium tracking-wide transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        fontSize: 13,
        padding: '11px 28px',
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(38,14,82,0.85) 0%, rgba(55,20,110,0.90) 100%)',
        border: '1px solid rgba(120,55,215,0.38)',
        color: 'rgba(200,155,255,0.90)',
        boxShadow: '0 4px 20px rgba(75,25,155,0.25), inset 0 1px 0 rgba(170,110,255,0.10)',
      }}
    >
      {children}
    </button>
  );
}

/* ── Ghost button ─────────────────────────────────────────── */
function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-sans uppercase tracking-wider transition-colors"
      style={{
        fontSize: 10,
        padding: '8px 18px',
        borderRadius: 20,
        border: '1px solid rgba(130,95,30,0.22)',
        color: 'rgba(150,120,50,0.55)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,160,60,0.75)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(170,125,40,0.38)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(150,120,50,0.55)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(130,95,30,0.22)';
      }}
    >
      {children}
    </button>
  );
}

/* ── Payment status banner ────────────────────────────────── */
function PaymentBannerBar({ type }: { type: PaymentBanner }) {
  if (!type) return null;

  const configs = {
    success: {
      bg: 'rgba(20,60,30,0.92)',
      border: 'rgba(50,160,80,0.45)',
      color: 'rgba(120,220,140,0.95)',
      icon: <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />,
      text: 'Payment confirmed — drawing your cards now…',
    },
    cancelled: {
      bg: 'rgba(50,35,10,0.92)',
      border: 'rgba(180,120,30,0.45)',
      color: 'rgba(220,175,80,0.90)',
      icon: <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />,
      text: 'Payment cancelled — no charge was made.',
    },
    failed: {
      bg: 'rgba(60,15,15,0.92)',
      border: 'rgba(180,50,50,0.45)',
      color: 'rgba(220,100,100,0.90)',
      icon: <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />,
      text: 'Payment could not be verified. Please try again or contact support.',
    },
  };

  const c = configs[type];

  return (
    <div
      className="fixed top-0 inset-x-0 flex items-center justify-center gap-2.5 font-sans fade-up"
      style={{
        zIndex: 100,
        padding: '12px 24px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        color: c.color,
        fontSize: 13,
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        maxWidth: 560,
        margin: '0 auto',
        left: 0,
        right: 0,
      }}
    >
      {c.icon}
      {c.text}
    </div>
  );
}

/* ── Candle ───────────────────────────────────────────────── */
function Candle({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        top: 16,
        [side === 'left' ? 'left' : 'right']: 20,
        zIndex: 10,
      }}
    >
      <div
        className="candle-glow-halo absolute rounded-full"
        style={{ width: 160, height: 160, top: -70, left: -72, pointerEvents: 'none' }}
      />
      <div
        className="candle-flame-outer absolute"
        style={{ width: 22, height: 32, borderRadius: '50% 50% 35% 35%', top: -4 }}
      />
      <div
        className="candle-flame-inner"
        style={{ width: 11, height: 22, borderRadius: '50% 50% 30% 30%', position: 'relative', zIndex: 2 }}
      />
      <div style={{ width: 1.5, height: 4, background: 'rgba(80,50,20,0.8)' }} />
      <div
        style={{
          width: 14, height: 52,
          borderRadius: '1px 1px 2px 2px',
          background: 'linear-gradient(180deg, #f0e4b0 0%, #d8c878 35%, #c0aa58 70%, #a08838 100%)',
          boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.25), inset 1px 0 2px rgba(255,255,200,0.15)',
        }}
      />
      <div
        style={{
          width: 14, height: 8,
          background: 'linear-gradient(180deg, #b09048 0%, #906820 100%)',
          borderRadius: '0 0 4px 4px',
        }}
      />
      <div
        style={{
          width: 22, height: 6, borderRadius: '2px',
          background: 'linear-gradient(180deg, #5a3a10 0%, #3a2008 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}

/* ── Physical table component ─────────────────────────────── */
interface TableProps {
  children: React.ReactNode;
  compact?: boolean;
}

function Table({ children, compact = false }: TableProps) {
  const surfaceH = compact ? 200 : 300;

  return (
    <div className="w-full" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div
        className="wood-surface relative overflow-hidden"
        style={{ minHeight: surfaceH, borderRadius: '3px 3px 0 0' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 12% 40%, rgba(220,130,25,0.07) 0%, transparent 38%),
              radial-gradient(ellipse at 88% 40%, rgba(210,120,20,0.06) 0%, transparent 38%),
              radial-gradient(ellipse at 50% 10%, rgba(190,120,30,0.04) 0%, transparent 30%)
            `,
          }}
        />
        <div
          className="velvet-runner absolute inset-x-0"
          style={{ top: compact ? '10%' : '14%', bottom: compact ? '10%' : '12%' }}
        >
          <div className="velvet-edge" style={{ position: 'absolute', inset: '0 0 auto 0', height: 5 }} />
          <div
            className="velvet-edge"
            style={{ position: 'absolute', inset: 'auto 0 0 0', height: 5, transform: 'rotateX(180deg)' }}
          />
          <div
            className="relative flex items-center justify-center h-full"
            style={{ padding: compact ? '10px 16px' : '18px 20px', gap: 0, zIndex: 10 }}
          >
            {children}
          </div>
        </div>
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,150,55,0.18), transparent)' }}
        />
      </div>
      <div className="wood-fascia" style={{ height: 20, borderRadius: '0 0 3px 3px' }} />
    </div>
  );
}

/* ── Draw button — free or paid ───────────────────────────── */
function DrawButton({
  spreadType,
  cardCount,
  onClick,
  loading,
}: {
  spreadType: string;
  cardCount: number;
  onClick: () => void;
  loading: boolean;
}) {
  const paid = isPaidSpread(spreadType);
  const priceLabel = getPriceLabel(spreadType);

  return (
    <GoldButton onClick={onClick} disabled={loading}>
      {loading ? (
        <>
          <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
          Opening Stripe…
        </>
      ) : paid ? (
        <>
          <CreditCard style={{ width: 15, height: 15 }} />
          <span>Draw {cardCount} Cards</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              padding: '1px 10px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.30)',
              color: 'rgba(255,210,60,1)',
              marginLeft: 4,
              letterSpacing: '0.01em',
            }}
          >
            {priceLabel}
          </span>
        </>
      ) : (
        <>
          <Shuffle style={{ width: 15, height: 15 }} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Draw {cardCount} {cardCount === 1 ? 'Card' : 'Cards'}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '1px 10px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.25)',
              color: 'rgba(120,220,100,1)',
              marginLeft: 4,
              letterSpacing: '0.04em',
            }}
          >
            Free
          </span>
        </>
      )}
    </GoldButton>
  );
}

/* ── Main App ─────────────────────────────────────────────── */
export default function App() {
  const [phase, setPhase] = useState<AppPhase>('select');
  const [selectedSpread, setSelectedSpread] = useState<SpreadType>('three');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [summary, setSummary] = useState<ReadingSummary | null>(null);
  const [isAI, setIsAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<PaymentBanner>(null);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const currentSpread = SPREADS.find((s) => s.type === selectedSpread)!;
  const allRevealed = drawnCards.length > 0 && drawnCards.every((dc) => dc.revealed);

  const handleSpreadSelect = useCallback((spread: SpreadConfig) => setSelectedSpread(spread.type), []);

  /* ── Verify Stripe session then draw ─────────────────────── */
  const verifyAndDraw = useCallback(async (sessionId: string, spreadType: SpreadType) => {
    setPaymentLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Verification failed (${response.status})`);
      }

      const data = await response.json();

      if (!data.paid) {
        setPaymentBanner('failed');
        setTimeout(() => setPaymentBanner(null), 6000);
        return;
      }

      const spread = SPREADS.find((s) => s.type === spreadType) ?? currentSpread;
      setPaymentBanner('success');
      setSelectedSpread(spreadType);

      setTimeout(() => {
        setPaymentBanner(null);
        setDrawnCards(drawCards(spread));
        setSummary(null);
        setError(null);
        setIsAI(false);
        setPhase('draw');
      }, 1800);
    } catch (err) {
      console.error('Payment verification error:', err);
      setPaymentBanner('failed');
      setTimeout(() => setPaymentBanner(null), 6000);
    } finally {
      setPaymentLoading(false);
    }
  }, [supabaseUrl, supabaseAnonKey, currentSpread]);

  /* ── Detect Stripe return URL params on mount ─────────────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const spread = params.get('spread') as SpreadType | null;
    const cancelled = params.get('cancelled');

    // Always clean URL params first
    if (success || cancelled) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (success === 'true' && sessionId && spread) {
      verifyAndDraw(sessionId, spread);
    } else if (cancelled === 'true') {
      setPaymentBanner('cancelled');
      setTimeout(() => setPaymentBanner(null), 5000);
    }
  // Run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Draw cards (free spreads) or initiate checkout ──────── */
  const handleDraw = useCallback(async () => {
    if (!isPaidSpread(currentSpread.type)) {
      // Free — draw immediately
      setDrawnCards(drawCards(currentSpread));
      setSummary(null);
      setError(null);
      setIsAI(false);
      setPhase('draw');
      return;
    }

    // Paid — create checkout session then show a link the user clicks.
    setPaymentLoading(true);
    setStripeUrl(null);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}`;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ spreadType: currentSpread.type, returnUrl }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Payment setup failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      // Show a clickable link — <a target="_blank"> is never blocked by iframe sandbox
      setStripeUrl(data.url);
      setPaymentLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  }, [currentSpread, supabaseUrl, supabaseAnonKey]);

  const handleReveal = useCallback((index: number) => {
    setDrawnCards((prev) => prev.map((dc, i) => i === index ? { ...dc, revealed: true } : dc));
  }, []);

  const handleRevealAll = useCallback(() => {
    setDrawnCards((prev) => prev.map((dc) => ({ ...dc, revealed: true })));
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsAI(false);

    try {
      const payload = drawnCards.map(({ card, orientation, position }) => ({ card, orientation, position }));

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ cards: payload }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (!data?.summary?.narrative) throw new Error('Unexpected response from reading service');

      const localFallback = buildLocalSummary(drawnCards);
      setSummary(data.summary);
      setIsAI(data.summary.narrative !== localFallback.narrative);
      setPhase('summary');
    } catch (err) {
      setSummary(buildLocalSummary(drawnCards));
      setIsAI(false);
      setPhase('summary');
      if (err instanceof Error && !err.message.includes('fetch')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [drawnCards, supabaseUrl, supabaseAnonKey]);

  const handleReset = useCallback(() => {
    setPhase('select');
    setDrawnCards([]);
    setSummary(null);
    setError(null);
    setLoading(false);
    setPaymentLoading(false);
    setPaymentBanner(null);
    setStripeUrl(null);
  }, []);

  return (
    <div
      className="chamber-bg min-h-screen relative"
      style={{ fontFamily: "'Palatino Linotype', Palatino, Georgia, serif" }}
    >
      {/* Payment banner */}
      <PaymentBannerBar type={paymentBanner} />

      {/* Candles */}
      <Candle side="left" />
      <Candle side="right" />

      {/* Corner vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.55) 0%, transparent 45%),
            radial-gradient(ellipse at 100% 0%, rgba(0,0,0,0.50) 0%, transparent 45%),
            radial-gradient(ellipse at 0% 100%, rgba(0,0,0,0.60) 0%, transparent 40%),
            radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.60) 0%, transparent 40%)
          `,
          zIndex: 1,
        }}
      />

      {/* Header */}
      <header
        className="relative flex items-center justify-between"
        style={{ padding: '22px 28px 14px', maxWidth: 960, margin: '0 auto', zIndex: 20 }}
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: 'rgba(180,135,45,0.58)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="1.1">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="gold-text font-serif font-semibold uppercase" style={{ fontSize: 14, letterSpacing: '0.14em' }}>
            The Arcana
          </span>
        </div>
        {phase !== 'select' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 transition-colors font-sans uppercase"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(130,100,35,0.55)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(190,148,55,0.75)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(130,100,35,0.55)')}
          >
            <RotateCcw style={{ width: 11, height: 11 }} />
            New
          </button>
        )}
      </header>

      {/* ── Main content ──────────────────────────────────────── */}
      <main
        className="relative"
        style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 80px', zIndex: 20 }}
      >

        {/* ─────── SELECT SPREAD ──────────────────────────────── */}
        {phase === 'select' && (
          <div className="flex flex-col items-center gap-10 fade-up" style={{ paddingTop: 48 }}>
            <div className="text-center" style={{ maxWidth: 440 }}>
              <div className="flex items-center justify-center gap-3 mb-5">
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(170,120,35,0.35))' }} />
                <span
                  className="font-sans uppercase"
                  style={{ fontSize: 9, letterSpacing: '0.38em', color: 'rgba(170,120,35,0.42)', flexShrink: 0 }}
                >
                  Chamber of Reflection
                </span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(170,120,35,0.35), transparent)' }} />
              </div>

              <h1
                className="font-serif font-bold leading-[1.06]"
                style={{ fontSize: 'clamp(38px,6vw,58px)', color: 'rgba(238,218,178,0.96)', marginBottom: 14 }}
              >
                Your Reading
                <br />
                <span className="gold-text">Awaits</span>
              </h1>
              <p
                className="font-sans leading-relaxed"
                style={{ fontSize: 13, color: 'rgba(140,110,65,0.65)' }}
              >
                Settle into stillness. Hold your question gently in mind.
                <br />
                When you feel ready, choose your spread and draw.
              </p>
            </div>

            <GoldDivider />

            <SpreadSelector selected={selectedSpread} onSelect={handleSpreadSelect} />

            {error && (
              <div
                className="w-full max-w-md font-sans text-center"
                style={{
                  padding: '12px 18px',
                  borderRadius: 6,
                  background: 'rgba(180,30,30,0.18)',
                  border: '1px solid rgba(220,60,60,0.35)',
                  color: 'rgba(255,140,140,0.95)',
                  fontSize: 13,
                  marginTop: -8,
                }}
              >
                {error}
              </div>
            )}

            {isPaidSpread(currentSpread.type) && !paymentLoading && (
              <p
                className="font-sans text-center"
                style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(160,120,40,0.55)', marginTop: -16 }}
              >
                You will be taken to Stripe to complete payment
              </p>
            )}

            <DrawButton
              spreadType={currentSpread.type}
              cardCount={currentSpread.count}
              onClick={handleDraw}
              loading={paymentLoading}
            />

            {stripeUrl && (
              <div
                className="flex flex-col items-center gap-3 w-full max-w-xs"
                style={{
                  padding: '16px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(15,40,10,0.55) 0%, rgba(10,30,8,0.60) 100%)',
                  border: '1px solid rgba(80,180,60,0.35)',
                  boxShadow: '0 2px 16px rgba(60,160,40,0.12)',
                }}
              >
                <p
                  className="font-sans text-center"
                  style={{ fontSize: 12, color: 'rgba(160,215,130,0.90)', letterSpacing: '0.02em' }}
                >
                  Checkout is ready — click below to pay securely with Stripe
                </p>
                <a
                  href={stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans font-semibold text-center w-full"
                  style={{
                    display: 'block',
                    padding: '11px 0',
                    borderRadius: 6,
                    fontSize: 14,
                    letterSpacing: '0.04em',
                    background: 'linear-gradient(135deg, rgba(60,160,40,0.75) 0%, rgba(40,130,25,0.80) 100%)',
                    border: '1px solid rgba(100,200,70,0.40)',
                    color: 'rgba(220,255,200,1)',
                    textDecoration: 'none',
                    boxShadow: '0 2px 10px rgba(60,160,40,0.20)',
                    transition: 'opacity 0.15s',
                  }}
                >
                  Open Stripe Checkout →
                </a>
                <button
                  onClick={() => setStripeUrl(null)}
                  className="font-sans"
                  style={{ fontSize: 10, color: 'rgba(120,160,90,0.55)', letterSpacing: '0.04em', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  cancel
                </button>
              </div>
            )}

            {/* Preview table */}
            <div className="w-full" style={{ opacity: 0.44, marginTop: 8 }}>
              <Table compact>
                <div />
              </Table>
            </div>
          </div>
        )}

        {/* ─────── DRAW CARDS ─────────────────────────────────── */}
        {phase === 'draw' && (
          <div className="flex flex-col items-center gap-6 fade-up" style={{ paddingTop: 28 }}>
            <div className="text-center">
              <p
                className="font-sans uppercase"
                style={{ fontSize: 9, letterSpacing: '0.30em', color: 'rgba(180,135,45,0.42)', marginBottom: 6 }}
              >
                {currentSpread.label}
              </p>
              <h2
                className="font-serif"
                style={{ fontSize: 24, color: 'rgba(230,210,170,0.92)' }}
              >
                {allRevealed ? 'The cards are before you' : 'Touch each card to reveal'}
              </h2>
              {!allRevealed && (
                <p
                  className="font-sans"
                  style={{ fontSize: 11, color: 'rgba(110,85,35,0.55)', marginTop: 4 }}
                >
                  {drawnCards.filter((dc) => !dc.revealed).length} card{drawnCards.filter((dc) => !dc.revealed).length !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>

            <Table>
              <div
                className="flex flex-wrap items-center justify-center"
                style={{ gap: currentSpread.count >= 5 ? 12 : 20, width: '100%' }}
              >
                {drawnCards.map((dc, i) => (
                  <TarotCard
                    key={dc.card.id + '-' + i}
                    drawnCard={dc}
                    index={i}
                    total={drawnCards.length}
                    onReveal={() => handleReveal(i)}
                  />
                ))}
              </div>
            </Table>

            <div className="flex items-center gap-4 flex-wrap justify-center" style={{ marginTop: 4 }}>
              {!allRevealed && (
                <GhostButton onClick={handleRevealAll}>Reveal all</GhostButton>
              )}
              {allRevealed && (
                <GoldButton onClick={() => setPhase('reading')}>
                  <Eye style={{ width: 15, height: 15 }} />
                  Read the Cards
                </GoldButton>
              )}
            </div>
          </div>
        )}

        {/* ─────── INDIVIDUAL READINGS ────────────────────────── */}
        {phase === 'reading' && (
          <div className="flex flex-col gap-5 fade-up" style={{ paddingTop: 24 }}>
            <div className="text-center">
              <p
                className="font-sans uppercase"
                style={{ fontSize: 9, letterSpacing: '0.30em', color: 'rgba(180,135,45,0.42)', marginBottom: 5 }}
              >
                Individual Readings
              </p>
              <h2
                className="font-serif"
                style={{ fontSize: 24, color: 'rgba(230,210,170,0.92)' }}
              >
                Explore Each Card
              </h2>
            </div>

            <Table compact>
              <div
                className="flex flex-wrap items-center justify-center"
                style={{ gap: 12, width: '100%' }}
              >
                {drawnCards.map((dc, i) => (
                  <TarotCard
                    key={dc.card.id + '-r-' + i}
                    drawnCard={{ ...dc, revealed: true }}
                    index={i}
                    total={drawnCards.length}
                    onReveal={() => {}}
                  />
                ))}
              </div>
            </Table>

            <GoldDivider />

            <div className="space-y-2" style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
              {drawnCards.map((dc, i) => (
                <CardReading key={i} drawnCard={dc} index={i} />
              ))}
            </div>

            <div className="flex flex-col items-center gap-3" style={{ paddingTop: 12 }}>
              {error && (
                <p
                  className="font-sans text-center"
                  style={{ fontSize: 11, color: 'rgba(200,80,80,0.65)' }}
                >
                  {error}
                </p>
              )}
              <VioletButton onClick={handleGenerateSummary} disabled={loading}>
                {loading ? (
                  <>
                    <div
                      className="rounded-full animate-spin border-2"
                      style={{ width: 14, height: 14, borderColor: 'rgba(190,130,255,0.25)', borderTopColor: 'rgba(200,150,255,0.80)' }}
                    />
                    Reading the cards…
                  </>
                ) : (
                  <>
                    <BookOpen style={{ width: 15, height: 15 }} />
                    Generate Full Reading
                  </>
                )}
              </VioletButton>
              <p
                className="font-sans"
                style={{ fontSize: 9, color: 'rgba(100,75,30,0.45)', letterSpacing: '0.12em' }}
              >
                Powered by Groq · llama3-70b
              </p>
            </div>
          </div>
        )}

        {/* ─────── COMBINED SUMMARY ───────────────────────────── */}
        {phase === 'summary' && summary && (
          <div
            className="flex flex-col gap-5 fade-up"
            style={{ paddingTop: 24, maxWidth: 680, margin: '0 auto', width: '100%' }}
          >
            <div className="text-center">
              <p
                className="font-sans uppercase"
                style={{ fontSize: 9, letterSpacing: '0.30em', color: 'rgba(180,135,45,0.42)', marginBottom: 5 }}
              >
                Your Combined Reading
              </p>
              <h2
                className="font-serif"
                style={{ fontSize: 24, color: 'rgba(230,210,170,0.92)' }}
              >
                The Full Picture
              </h2>
            </div>

            <ReadingSummaryPanel summary={summary} isAI={isAI} />

            <div className="flex flex-wrap items-center justify-center gap-3" style={{ paddingTop: 6 }}>
              <GhostButton onClick={() => setPhase('reading')}>
                Back to cards
              </GhostButton>
              <GoldButton onClick={handleReset}>
                <Shuffle style={{ width: 13, height: 13 }} />
                New reading
              </GoldButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
