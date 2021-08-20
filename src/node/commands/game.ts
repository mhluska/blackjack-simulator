import { Events } from '../../event-emitter';
import Game, { GameSettings, SETTINGS_DEFAULTS } from '../../game';
import CLIRenderer from '../../cli-renderer';
import FileStorage from '../../file-storage';
import PlayerInputReader from '../player-input-reader';
import {
  Move,
  GameStep,
  parseGameMode,
  parseBlackjackPayout,
  blackjackPayoutToString,
  gameModeToString,
} from '../../types';
import Utils from '../../utils';
import { CliSettings, printUsageOptions } from '../utils';

interface CliGameSettings
  extends Omit<GameSettings, 'mode' | 'blackjackPayout'> {
  mode: string;
  blackjackPayout: string;
}

function parseEnums(
  options: Partial<CliGameSettings & CliSettings>
): Partial<GameSettings> {
  return Utils.compact({
    ...options,
    mode: parseGameMode(options.mode),
    blackjackPayout: parseBlackjackPayout(options.blackjackPayout),
  });
}

// TODO: Move commands out of the /src directory once we move to WebAssembly.
// Any async/eventloop concerns should be moved out since it doesn't support it.
function stepGame(
  game: Game,
  playerInputReader: PlayerInputReader,
  input: Move | undefined
) {
  const step = game.step(input);

  if (
    ![
      GameStep.WaitingForPlayInput,
      GameStep.WaitingForInsuranceInput,
      GameStep.WaitingForNewGameInput,
    ].includes(step)
  ) {
    return Promise.resolve(undefined);
  }

  return new Promise<Move>((resolve) => playerInputReader.readInput(resolve));
}

export default async function (
  options: Partial<CliGameSettings & CliSettings>
): Promise<void> {
  if (options.help) {
    console.log('Usage: simulator game [options]');
    console.log();
    console.log('Options:');

    printUsageOptions<GameSettings>(SETTINGS_DEFAULTS, {
      mode: {
        hint: '[default | pairs | uncommon | illustrious18]',
        formatter: gameModeToString,
      },
      blackjackPayout: {
        hint: '[3:2 | 6:5]',
        formatter: (blackjackPayout) =>
          blackjackPayoutToString(blackjackPayout),
      },
      playerBankroll: { formatter: Utils.formatCents },
      maximumBet: { formatter: Utils.formatCents },
      minimumBet: { formatter: Utils.formatCents },
    });

    return;
  }

  const game = new Game(parseEnums(options));
  const renderer = new CLIRenderer(game);
  const storage = new FileStorage();
  const playerInputReader = new PlayerInputReader();

  game.on(Events.Change, () => renderer.render());
  game.on(Events.CreateRecord, storage.createRecord);

  let input: Move | undefined;

  (async function () {
    while (true) {
      input = await stepGame(game, playerInputReader, input);
    }
  })();
}
