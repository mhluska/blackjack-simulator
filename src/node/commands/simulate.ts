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
      playerStrategy: {
        hint: '[basic-strategy | basic-strategy-i18]',
      },
      playerBetSpread: {
        hint: '(bets at TC 0, 1, 2 etc)',
        formatter: (array) =>
          array
            .map((item) =>
              Utils.formatCents(item, {
                stripCommas: true,
                stripZeroCents: true,
              })
            )
            .join(','),
      },
      playerSpots: { hint: '(spots played at TC 0, 1, 2 etc)' },
      playerBankroll: { formatter: Utils.formatCents },
      maximumBet: { formatter: Utils.formatCents },
      minimumBet: { formatter: Utils.formatCents },
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
    'stdDeviation',
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
