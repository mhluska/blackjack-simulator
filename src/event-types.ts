import { Event } from './event-emitter';
import Hand, { HandAttributes } from './hand';
import { CardAttributes } from './card';
import { HandWinner } from './types';

// Attributes returned by each GameObject subclass.
export type PlayerAttributes = {
  id: string;
  balance: number;
  hands: HandAttributes[];
  handWinner: { [id: string]: string };
};

export type ShoeAttributes = {
  cards: CardAttributes[];
  hiLoRunningCount: number;
  hiLoTrueCount: number;
  penetration: number;
};

// Union of all possible values emitted with Event.Change.
export type ChangeValue =
  | PlayerAttributes
  | HandAttributes
  | CardAttributes
  | ShoeAttributes
  | string
  | number;

// Type guard for narrowing ChangeValue to PlayerAttributes.
export function isPlayerAttributes(
  value: ChangeValue
): value is PlayerAttributes {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hands' in value &&
    'handWinner' in value
  );
}

// Maps each Event enum member to its argument tuple.
export type EventMap = {
  [Event.Change]: [name: string, value: ChangeValue];
  [Event.HandWinner]: [hand: Hand, winner: HandWinner];
  [Event.CreateRecord]: [recordName: string, data: Record<string, unknown>];
  [Event.Shuffle]: [];
  [Event.ResetState]: [];
};
