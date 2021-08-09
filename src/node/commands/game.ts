import { Events } from '../../event-emitter';
import Game, { GameSettings, SETTINGS_DEFAULTS } from '../../game';
import CLIRenderer from '../../cli-renderer';
import FileStorage from '../../file-storage';
import PlayerInputReader from '../player-input-reader';
import { actions } from '../../types';
import Utils from '../../utils';
import { CliSettings, printUsageOptions } from '../utils';

// TODO: Move commands out of the /src directory once we move to WebAssembly.
// Any async/eventloop concerns should be moved out since it doesn't support it.
function stepGame(
  game: Game,
  playerInputReader: PlayerInputReader,
  input: actions | undefined
) {
  const step = game.step(input);

  if (!step.startsWith('waiting-for')) {
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
      mode: { hint: '[default | pairs | uncommon | illustrious18]' },
      playerBankroll: { formatter: Utils.formatCents },
      maximumBet: { formatter: Utils.formatCents },
      minimumBet: { formatter: Utils.formatCents },
    });

    return;
  }

  const game = new Game(options);
  const renderer = new CLIRenderer(game);
  const storage = new FileStorage();
  const playerInputReader = new PlayerInputReader();

  game.on(Events.Change, () => renderer.render());
  game.on(Events.CreateRecord, storage.createRecord);

  let input: actions | undefined;

  (async function () {
    while (true) {
      input = await stepGame(game, playerInputReader, input);
    }
  })();
}
