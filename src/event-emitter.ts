interface EventMapBase {
  [key: number]: unknown[];
}

export enum Event {
  Change = 0,
  HandWinner = 1,
  CreateRecord = 2,
  Shuffle = 3,
  ResetState = 4,
}

export default class EventEmitter<
  TMap extends EventMapBase = Record<number, unknown[]>,
> {
  static disableEvents: boolean;

  events: Map<number, ((...args: unknown[]) => void)[]>;

  constructor() {
    this.events = new Map();
  }

  on<E extends keyof TMap & number>(
    event: E,
    listener: (...args: TMap[E]) => void,
  ): void {
    if (EventEmitter.disableEvents) {
      return;
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const events = this.events.get(event);
    if (!events) {
      return;
    }

    events.push(listener as (...args: unknown[]) => void);
  }

  removeListener<E extends keyof TMap & number>(
    event: E,
    listener: (...args: TMap[E]) => void,
  ): void {
    if (EventEmitter.disableEvents) {
      return;
    }

    const events = this.events.get(event);
    if (!events) {
      return;
    }

    const index = events.indexOf(listener as (...args: unknown[]) => void);
    if (index === -1) {
      return;
    }

    events.splice(index, 1);
  }

  removeAllListeners<E extends keyof TMap & number>(event: E): void {
    if (EventEmitter.disableEvents) {
      return;
    }

    this.events.delete(event);
  }

  emit<E extends keyof TMap & number>(event: E, ...args: TMap[E]): void {
    if (EventEmitter.disableEvents) {
      return;
    }

    const events = this.events.get(event);
    if (!events) {
      return;
    }

    const listeners = events.slice();

    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i].apply(this, args);
    }
  }
}
