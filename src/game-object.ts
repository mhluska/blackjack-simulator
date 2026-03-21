import EventEmitter, { Event } from './event-emitter';
import type { EventMap, ChangeValue } from './event-types';

export default class GameObject extends EventEmitter<EventMap> {
  // NOTE: Implement this in a subclass. We use an instance property instead of
  // accessing the static via this.constructor because TypeScript types
  // this.constructor as Function, which would require a cast.
  entityName = '';

  emitChange = (): void => {
    // We need this here to prevent the expensive `attributes()` call during
    // simulator runs.
    if (!EventEmitter.disableEvents) {
      this.emit(Event.Change, this.entityName, this.attributes());
    }
  };

  attributes(): ChangeValue {
    throw new Error('Implement this');
  }
}
