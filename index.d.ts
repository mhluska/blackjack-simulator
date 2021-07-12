declare module 'player-input-reader' {
  export default class PlayerInputReader {
    constructor(game: unknown);
    game: unknown;
    readInput: <T>(handlers: unknown) => Promise<T>;
  }
}
