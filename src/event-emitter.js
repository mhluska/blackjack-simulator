export default class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (typeof this.events[event] !== 'object') {
      this.events[event] = [];
    }

    this.events[event].push(listener);
  }

  removeListener(event, listener) {
    if (typeof this.events[event] !== 'object') {
      return;
    }

    const index = indexOf(this.events[event], listener);
    if (index === -1) {
      return;
    }

    this.events[event].splice(index, 1);
  }

  emit(event) {
    if (typeof this.events[event] !== 'object') {
      return;
    }

    const listeners = this.events[event].slice();
    const args = [].slice.call(arguments, 1);

    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i].apply(this, args);
    }
  }

  once(event, listener) {
    this.on(event, () => {
      this.removeListener(event, g);
      listener.apply(this, arguments);
    });
  }
}
