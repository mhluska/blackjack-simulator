import { actions } from './types';

export default interface PlayerInputReader {
  readInput(handler: (action: actions) => void): void;
}
