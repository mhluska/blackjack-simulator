import Game, { GameSettings, SETTINGS_DEFAULTS } from '../../game';
import CLIRenderer from '../../cli-renderer';
import FileStorage from '../../file-storage';

import { CliSettings, printUsageOptions } from '../utils';

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

  game.on('change', () => renderer.render());
  game.on('create-record', storage.createRecord);

  (async function () {
    while (true) {
      await game.run();
      renderer.render();
    }
  })();
}
