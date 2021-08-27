// TODO: Avoid using `any` here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

export enum Event {
  Change = 0,
  HandWinner = 1,
  CreateRecord = 2,
  Shuffle = 3,
  ResetState = 4,
}

export default class EventEmitter {
  static disableEvents: boolean;

  events: Map<Event, Listener[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: Event, listener: Listener): void {
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

    events.push(listener);
  }

  removeListener(event: Event, listener: Listener): void {
    if (EventEmitter.disableEvents) {
      return;
    }

    const events = this.events.get(event);
    if (!events) {
      return;
    }

    const index = events.indexOf(listener);
    if (index === -1) {
      return;
    }

    events.splice(index, 1);
  }

  emit(event: Event, ...args: unknown[]): void {
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
