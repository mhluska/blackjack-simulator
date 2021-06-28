type Listener = (...args: unknown[]) => void;

export default class EventEmitter {
  static disableEvents: boolean;

  events: { [key: string]: Listener[] };

  constructor() {
    this.events = {};
  }

  on(event: string, listener: Listener): void {
    if (typeof this.events[event] !== 'object') {
      this.events[event] = [];
    }

    if (EventEmitter.disableEvents) {
      return;
    }

    this.events[event].push(listener);
  }

  removeListener(event: string, listener: Listener): void {
    if (typeof this.events[event] !== 'object') {
      return;
    }

    if (EventEmitter.disableEvents) {
      return;
    }

    // TODO: Fix this. It's probably broken.
    const index = this.events[event].indexOf(listener);
    if (index === -1) {
      return;
    }

    this.events[event].splice(index, 1);
  }

  emit(event: string, ...args: unknown[]): void {
    if (typeof this.events[event] !== 'object') {
      return;
    }

    if (EventEmitter.disableEvents) {
      return;
    }

    const listeners = this.events[event].slice();

    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i].apply(this, args);
    }
  }
}
