import EventEmitter from './event-emitter.js';

export default class GameObject extends EventEmitter {
  // NOTE: Implement this in a subclass. We need this because the minifier will
  // mangle the class name.
  // static entityName = '';

  emitChange() {
    if (!EventEmitter.disableEvents) {
      this.emit('change', this.constructor.entityName, this.attributes());
    }
  }

  attributes() {
    throw new Error('Implement this');
  }
}
