import EventEmitter, { Event } from './event-emitter';
import type { EventMap, ChangeValue } from './event-types';

export function getEntityName(
  ctor: Function & { entityName?: string }
): string {
  const name = ctor.entityName;
  return typeof name === 'string' ? name : '';
}

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
        getEntityName(this.constructor),
        this.attributes()
      );
    }
  };

  attributes(): ChangeValue {
    throw new Error('Implement this');
  }
}
