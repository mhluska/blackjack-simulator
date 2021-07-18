import Simulator, {
  SimulatorSettings,
  SimulatorResult,
  SETTINGS_DEFAULTS,
} from '../../simulator';

import { CliSettings, printUsageOptions, titleCase } from '../utils';
import { entries } from '../../types';

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
  const displayOrder: (keyof SimulatorResult)[] = [
    'tableRules',
    'handsPlayed',
    'expectedValue',
    'houseEdge',
    'variance',
  ];

  // TODO: Format without tabs (format table with spaces).
  const print = (key: string, value: string | number) =>
    console.log(`${titleCase(key)}:\t${value}`);

  // Print the most relevant options first (iteration order of a POJO is not
  // guaranteed).
  displayOrder.forEach((key) => {
    print(key, result[key]);
  });

  entries(result).forEach(([key, value]) => {
    if (!displayOrder.includes(key)) {
      print(key, value);
    }
  });
}
