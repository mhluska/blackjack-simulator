import Simulator, {
  SimulatorSettings,
  SimulatorResult,
  SETTINGS_DEFAULTS,
} from '../../simulator';

import { CliSettings, printUsageOptions } from '../utils';
import { entries } from '../../types';
import Utils from '../../utils';

export default function (
  options: Partial<SimulatorSettings & CliSettings>
): void {
  if (options.help) {
    console.log('Usage: simulator simulate [options]');
    console.log();
    console.log('Options:');

    printUsageOptions<SimulatorSettings>(SETTINGS_DEFAULTS, {
      playerStrategy: '[basic-strategy | basic-strategy-i18]',
      playerBetSpread: '(bets at TC 0, 1, 2 etc)',
      playerSpots: '(spots played at TC 0, 1, 2 etc)',
    });

    return;
  }

  const simulator = new Simulator(options);

  const result = simulator.run();
  const displayOrder: (keyof SimulatorResult)[] = [
    'tableRules',
    'betSpread',
    'spotsPlayed',
    'expectedValue',
    'houseEdge',
    'handsPlayed',
    'variance',
  ];

  // TODO: Format without tabs (format table with spaces).
  const print = (key: string, value: string | number) =>
    console.log(`${Utils.titleCase(key)}:\t${value}`);

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
