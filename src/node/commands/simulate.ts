import Simulator, {
  SimulatorSettings,
  SimulatorResult,
  SETTINGS_DEFAULTS,
} from '../../simulator';

import { CliSettings, printUsageOptions } from '../utils';
import {
  entries,
  keys,
  parsePlayerStrategy,
  parseBlackjackPayout,
  blackjackPayoutToString,
  playerStrategyToString,
} from '../../types';
import Utils from '../../utils';

interface CliSimulatorSettings
  extends Omit<SimulatorSettings, 'playerStrategy' | 'blackjackPayout'> {
  playerStrategy: string;
  blackjackPayout: string;
}

function parseEnums(
  options: Partial<CliSimulatorSettings & CliSettings>
): Partial<SimulatorSettings> {
  return Utils.compact({
    ...options,
    playerStrategy: parsePlayerStrategy(options.playerStrategy),
    blackjackPayout: parseBlackjackPayout(options.blackjackPayout),
  });
}

// TODO: Move commands out of the /src directory once we move to WebAssembly.
// Any async/eventloop concerns should be moved out since it doesn't support it.
// TODO: After moving this out of /src, we can drop TypeScript here and avoid
// using our custom `entries()` function which is also not compatible with
// AssemblyScript.
export default function (
  options: Partial<CliSimulatorSettings & CliSettings>
): void {
  if (options.help) {
    console.log('Usage: simulator simulate [options]');
    console.log();
    console.log('Options:');

    printUsageOptions<SimulatorSettings>(SETTINGS_DEFAULTS, {
      blackjackPayout: {
        hint: '[3:2 | 6:5]',
        formatter: blackjackPayoutToString,
      },
      playerStrategy: {
        hint: '[basic-strategy | basic-strategy-i18]',
        formatter: playerStrategyToString,
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

  const simulator = new Simulator(parseEnums(options));

  const result = simulator.run();
  const displayOrder: (keyof SimulatorResult)[] = [
    'tableRules',
    'penetration',
    'betSpread',
    'spotsPlayed',
    'bankrollRqd',
    'expectedValue',
    'stdDeviation',
    'houseEdge',
    'handsPlayed',
  ];

  const longestLabelLength = Math.max(...keys(result).map((key) => key.length));

  const print = (key: string, value: string | number) => {
    const label = `${Utils.titleCase(key)}:`;
    console.log(`${label.padEnd(longestLabelLength + 3, ' ')}${value}`);
  };

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
