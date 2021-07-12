import EventEmitter from './event-emitter';

export default class GameObject extends EventEmitter {
  // NOTE: Implement this in a subclass. We need this because the minifier will
  // mangle the class name.
  static entityName = '';

  emitChange(): void {
    if (!EventEmitter.disableEvents) {
      this.emit('change', GameObject.entityName, this.attributes());
    }
  }

  attributes(): void {
    throw new Error('Implement this');
  }
}
