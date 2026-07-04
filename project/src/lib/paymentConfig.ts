// ── Payment config ─────────────────────────────────────────────────────────────
// Edit this file to update prices, labels, and which spreads require payment.
// Keys must match the SpreadType values in src/data/tarotDeck.ts ('single', 'three', 'celtic').

export interface SpreadPricing {
  /** Display label shown on the button and spread card, e.g. "$2.99" */
  label: string;
  /** Amount in the smallest currency unit (cents for USD/GBP) */
  priceInCents: number;
  /** ISO 4217 currency code, e.g. "usd" or "gbp" */
  currency: string;
}

/** Spreads listed here require payment before drawing.
 *  Spreads omitted from this map are free. */
export const PAID_SPREADS: Record<string, SpreadPricing> = {
  three: {
    label: '$5.00',
    priceInCents: 500,
    currency: 'usd',
  },
  celtic: {
    label: '$9.00',
    priceInCents: 900,
    currency: 'usd',
  },
};

export function isPaidSpread(spreadType: string): boolean {
  return Object.prototype.hasOwnProperty.call(PAID_SPREADS, spreadType);
}

export function getPriceLabel(spreadType: string): string {
  return PAID_SPREADS[spreadType]?.label ?? 'Free';
}
