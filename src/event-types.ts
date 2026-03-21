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

// Type guard for objects with an attributes() method (e.g. GameObject subclasses).
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function hasAttributes(
  value: unknown
): value is { attributes: () => ChangeValue } {
  return (
    isRecord(value) &&
    'attributes' in value &&
    typeof value.attributes === 'function'
  );
}

// Maps each Event enum member to its argument tuple.
export type EventMap = {
  [Event.Change]: [string, ChangeValue];
  [Event.HandWinner]: [Hand, HandWinner];
  [Event.CreateRecord]: [string, Record<string, unknown>];
  [Event.Shuffle]: [];
  [Event.ResetState]: [];
};
