import type { TarotCard } from '../types/tarot';
import { majorArcana } from './majorArcana';
import { wands } from './wands';
import { cups } from './cups';
import { swords } from './swords';
import { pentacles } from './pentacles';

export const tarotDeck: TarotCard[] = [
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles,
];

export { majorArcana, wands, cups, swords, pentacles };
