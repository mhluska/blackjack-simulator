import Game, { GameSettings, SETTINGS_DEFAULTS } from '../../game';
import CLIRenderer from '../../cli-renderer';
import FileStorage from '../../file-storage';
import PlayerInputReader from '../player-input-reader';
import { actions } from '../../types';

import { CliSettings, printUsageOptions } from '../utils';

// TODO: Move commands out of the /src directory once we move to WebAssembly.
// Any async/eventloop concerns should be moved out since it doesn't support it.
function stepGame(
  game: Game,
  playerInputReader: PlayerInputReader,
  input: actions | undefined
) {
  const step = game.step(input);

  if (
    step !== 'ask-insurance' &&
    step !== 'play-hands' &&
    step !== 'game-result'
  ) {
    return Promise.resolve(undefined);
  }

  return new Promise<actions>((resolve) =>
    playerInputReader.readInput(resolve)
  );
}

export default async function (
  options: Partial<GameSettings & CliSettings>
): Promise<void> {
  if (options.help) {
    console.log('Usage: simulator game [options]');
    console.log();
    console.log('Options:');

    printUsageOptions<GameSettings>(SETTINGS_DEFAULTS, {
      mode: '[default | pairs | uncommon | illustrious18]',
    });

    return;
  }

  const game = new Game(options);
  const renderer = new CLIRenderer(game);
  const storage = new FileStorage();
  const playerInputReader = new PlayerInputReader();

  game.on('change', () => renderer.render());
  game.on('create-record', storage.createRecord);

  let input: actions | undefined;

  (async function () {
    while (true) {
      input = await stepGame(game, playerInputReader, input);
    }
  })();
}
