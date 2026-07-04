import type { DrawnCard, ReadingSummary } from '../types/tarot';

export function buildLocalSummary(drawnCards: DrawnCard[]): ReadingSummary {
  const readings = drawnCards.map((dc) =>
    dc.orientation === 'upright' ? dc.card.upright : dc.card.reversed
  );

  // Theme from first card, coloured by last
  const theme =
    readings.length === 1
      ? readings[0].theme
      : `${readings[0].theme} As this unfolds, ${readings[readings.length - 1].theme.toLowerCase()}`;

  // Shadow: first reversed card's shadow, else middle card's
  const firstReversed = drawnCards.find((dc) => dc.orientation === 'reversed');
  const shadow = firstReversed
    ? firstReversed.card.reversed.shadow
    : readings[Math.floor(readings.length / 2)]?.shadow ?? readings[0].shadow;

  // Advice: one per card, max 3
  const advice = readings.slice(0, 3).map((r) => r.advice);

  // Closing: last upright card's closing, else last card's
  const uprightCards = drawnCards.filter((dc) => dc.orientation === 'upright');
  const closingSource = uprightCards.length > 0
    ? uprightCards[uprightCards.length - 1]
    : drawnCards[drawnCards.length - 1];
  const closing = (
    closingSource.orientation === 'upright'
      ? closingSource.card.upright
      : closingSource.card.reversed
  ).closing;

  // Fallback narrative
  const cardNames = drawnCards.map((dc) => dc.card.name).join(', ');
  const keywordSample = readings.flatMap((r) => r.keywords).slice(0, 4).join(', ');
  const narrative = `Your spread of ${cardNames} speaks to a moment shaped by ${keywordSample}. ${readings[0].reframe} ${closing}`;

  return { narrative, theme, shadow, advice, closing };
}
