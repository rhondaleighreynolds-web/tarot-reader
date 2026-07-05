import type { ReadingSummary } from '../types/tarot';

interface ReadingSummaryPanelProps {
  summary: ReadingSummary;
  isAI: boolean;
}

export function ReadingSummaryPanel({ summary, isAI }: ReadingSummaryPanelProps) {
  return (
    <div
      className="rounded-sm overflow-hidden fade-up"
      style={{
        background: 'linear-gradient(160deg, rgba(18,10,5,0.97) 0%, rgba(12,7,3,0.98) 100%)',
        border: '1px solid rgba(170,125,38,0.26)',
        boxShadow: '0 0 0 1px rgba(55,32,8,0.30), 0 24px 60px rgba(0,0,0,0.70), inset 0 1px 0 rgba(170,125,38,0.08)',
      }}
    >
      {/* Top gold line */}
      <div
        className="h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(180,135,45,0.60), transparent)' }}
      />

      <div className="px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 16 16" style={{ width: 13, height: 13, color: 'rgba(180,135,45,0.55)', flexShrink: 0 }} fill="currentColor">
              <path d="M8 0.5L9.4 6.6L15.5 8L9.4 9.4L8 15.5L6.6 9.4L0.5 8L6.6 6.6Z" />
            </svg>
            <span
              className="font-sans uppercase"
              style={{ fontSize: 9, letterSpacing: '0.32em', color: 'rgba(180,135,45,0.50)' }}
            >
              Your Reading
            </span>
          </div>
          {isAI && (
            <span
              className="font-sans uppercase rounded-full"
              style={{
                fontSize: 8,
                letterSpacing: '0.15em',
                padding: '2px 8px',
                border: '1px solid rgba(130,65,200,0.28)',
                color: 'rgba(170,100,240,0.55)',
              }}
            >
              Groq · llama3-70b
            </span>
          )}
        </div>

        {/* Narrative */}
        <p
          className="font-serif leading-[1.80] mb-7"
          style={{ fontSize: 15, color: 'rgba(228,208,170,0.92)', letterSpacing: '0.01em' }}
        >
          {summary.narrative}
        </p>

        {/* Gold divider */}
        <div
          className="mb-6"
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(160,120,35,0.30), rgba(100,65,15,0.15), transparent)',
          }}
        />

        {/* Theme + Shadow */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <SummaryBlock
            label="Overarching Theme"
            text={summary.theme}
            borderColor="rgba(180,130,38,0.22)"
            bgColor="rgba(180,130,38,0.06)"
            labelColor="rgba(200,155,50,0.58)"
          />
          <SummaryBlock
            label="Shadow to Sit With"
            text={summary.shadow}
            borderColor="rgba(130,65,200,0.22)"
            bgColor="rgba(100,40,180,0.08)"
            labelColor="rgba(160,90,230,0.58)"
          />
        </div>

        {/* Steps */}
        <div className="mb-6">
          <p
            className="font-sans uppercase mb-3"
            style={{ fontSize: 9, letterSpacing: '0.28em', color: 'rgba(70,140,200,0.55)', fontWeight: 500 }}
          >
            Gentle steps forward
          </p>
          <div className="space-y-3">
            {summary.advice.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 rounded-full flex items-center justify-center font-mono"
                  style={{
                    width: 20,
                    height: 20,
                    marginTop: 1,
                    border: '1px solid rgba(70,140,200,0.28)',
                    fontSize: 9,
                    color: 'rgba(90,155,215,0.55)',
                  }}
                >
                  {i + 1}
                </div>
                <p
                  className="font-sans leading-relaxed"
                  style={{ fontSize: 13, color: 'rgba(200,180,140,0.85)' }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div
          className="pt-5"
          style={{ borderTop: '1px solid rgba(160,115,35,0.12)' }}
        >
          <p
            className="font-serif italic text-center leading-relaxed"
            style={{ fontSize: 14, color: 'rgba(210,175,90,0.72)', letterSpacing: '0.01em' }}
          >
            {summary.closing}
          </p>
        </div>
      </div>

      {/* Bottom gold line */}
      <div
        className="h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(170,125,38,0.40), transparent)' }}
      />
    </div>
  );
}

function SummaryBlock({
  label, text, borderColor, bgColor, labelColor,
}: {
  label: string; text: string;
  borderColor: string; bgColor: string; labelColor: string;
}) {
  return (
    <div
      className="rounded-sm p-4"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      <p
        className="font-sans uppercase mb-2"
        style={{ fontSize: 9, letterSpacing: '0.22em', color: labelColor, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="font-sans leading-relaxed"
        style={{ fontSize: 13, color: 'rgba(200,178,138,0.85)' }}
      >
        {text}
      </p>
    </div>
  );
}
