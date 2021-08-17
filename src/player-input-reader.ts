import { Move } from './types';

export default interface PlayerInputReader {
  readInput(handler: (action: Move) => void): void;
}
