export interface CardOrientation {
  keywords: string[];
  theme: string;
  shadow: string;
  reframe: string;
  advice: string;
  closing: string;
}

export interface TarotCard {
  id: string;
  name: string;
  arcana: 'Major' | 'Minor';
  suit: 'Wands' | 'Cups' | 'Swords' | 'Pentacles' | null;
  number: number;
  upright: CardOrientation;
  reversed: CardOrientation;
}

export type Orientation = 'upright' | 'reversed';

export interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position: string;
  revealed: boolean;
}

export interface ReadingSummary {
  narrative: string;
  theme: string;
  shadow: string;
  advice: string[];
  closing: string;
}

export type SpreadType = 'single' | 'three' | 'celtic';

export interface SpreadConfig {
  type: SpreadType;
  label: string;
  count: number;
  positions: string[];
  description: string;
}
