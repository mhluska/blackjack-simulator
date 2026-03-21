import EventEmitter, { Event } from './event-emitter';
import type { EventMap, ChangeValue } from './event-types';

export default class GameObject extends EventEmitter<EventMap> {
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

  attributes(): ChangeValue {
    throw new Error('Implement this');
  }
}
