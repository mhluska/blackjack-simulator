import EventEmitter, { Event } from './event-emitter';

export default class GameObject extends EventEmitter {
  // NOTE: Implement this in a subclass. We need this because the minifier will
  // mangle the class name.
  static entityName = '';

  emitChange = (): void => {
    // We need this here to prevent the expensive `attributes()` call during
    // simulator runs.
    if (!EventEmitter.disableEvents) {
      this.emit(
        Event.Change,
        (this.constructor as typeof GameObject).entityName,
        this.attributes()
      );
    }
  };

  attributes(): void {
    throw new Error('Implement this');
  }
}
