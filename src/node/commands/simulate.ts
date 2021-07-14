import Simulator, {
  SimulatorSettings,
  SETTINGS_DEFAULTS,
} from '../../simulator';

import { CliSettings, printUsageOptions } from '../utils';

export default async function (
  options: Partial<SimulatorSettings & CliSettings>
): Promise<void> {
  if (options.help) {
    console.log('Usage: simulator simulate [options]');
    console.log();
    console.log('Options:');

    printUsageOptions<SimulatorSettings>(SETTINGS_DEFAULTS, {
      playerStrategy: '[basic-strategy | basic-strategy-i18]',
    });

    return;
  }

  const simulator = new Simulator(options);

  const result = await simulator.run();

  Object.entries(result).forEach(([key, value]) => {
    console.log(key, value);
  });
}
