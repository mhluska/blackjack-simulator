import { cpus } from 'os';
import { fork } from 'child_process';

import Simulator, {
  SimulatorSettings,
  SimulatorResult,
  AugmentedSimulatorResult,
  FormattedResult,
  FormattedSimulatorIntro,
  FormattedSimulatorResult,
  SETTINGS_DEFAULTS,
  mergeResults,
  bankrollRequired,
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

function printEntries(
  result: FormattedResult,
  displayOrder: (keyof FormattedResult)[]
) {
  const longestLabelLength = Math.max(
    ...keys(result).map((key) => key.toString().length)
  );

  const print = (key: string, value: string | number) => {
    const label = `${Utils.titleCase(key)}:`;
    console.log(`${label.padEnd(longestLabelLength + 3, ' ')}${value}`);
  };

  // Print the most relevant options first (iteration order of a POJO is not
  // guaranteed).
  displayOrder.forEach((key) => {
    const value = result[key];
    if (value) {
      print(key.toString(), value);
    }
  });

  entries(result).forEach(([key, value]) => {
    if (!displayOrder.includes(key) && value) {
      print(key.toString(), value);
    }
  });
}

// TODO: Move these stdout-related functions to a renderer.
function printIntro(result: FormattedSimulatorIntro, handsCount: number) {
  printEntries(result, [
    'tableRules',
    'penetration',
    'betSpread',
    'spotsPlayed',
  ]);

  const handsWord = handsCount === 1 ? 'hand' : 'hands';
  process.stdout.write(
    `Simulating ${Utils.abbreviateNumber(handsCount)} ${handsWord}...`
  );
}

function printResult(result: FormattedSimulatorResult) {
  console.log();
  console.log();

  printEntries(result, [
    'expectedValue',
    'bankrollRqd',
    'riskOfRuin',
    'stdDeviation',
    'houseEdge',
    'handsPlayed',
  ]);
}

function createResultFormatter(
  raw: CliSettings['raw']
): (result: AugmentedSimulatorResult) => FormattedSimulatorResult {
  return (result: AugmentedSimulatorResult): FormattedSimulatorResult => {
    if (raw) {
      return Utils.mapValues(result, (value) => value.toString());
    }

    const {
      amountEarned,
      amountWagered,
      bankrollRqd,
      expectedValue,
      handsLost,
      handsPlayed,
      handsPushed,
      handsWon,
      houseEdge,
      riskOfRuin,
      stdDeviation,
      timeElapsed,
    } = result;

    return {
      amountEarned: Utils.formatCents(amountEarned),
      amountWagered: Utils.formatCents(amountWagered),
      bankrollRqd: Utils.formatCents(bankrollRqd),
      expectedValue: `${Utils.formatCents(expectedValue)}/hour`,
      handsLost: Utils.abbreviateNumber(handsLost),
      handsPlayed: Utils.abbreviateNumber(handsPlayed),
      handsPushed: Utils.abbreviateNumber(handsPushed),
      handsWon: Utils.abbreviateNumber(handsWon),
      houseEdge: Utils.formatPercent(houseEdge),
      riskOfRuin: Utils.formatPercent(riskOfRuin),
      stdDeviation: `${Utils.formatCents(stdDeviation)}/hand`,
      timeElapsed: Utils.formatTime(timeElapsed),
    };
  };
}

function augmentResult(result: SimulatorResult): AugmentedSimulatorResult {
  const {
    amountEarned,
    bankrollVariance,
    handsPlayed,
    hoursPlayed,
    riskOfRuin,
  } = result;

  return {
    ...result,
    bankrollRqd: bankrollRequired(
      riskOfRuin,
      bankrollVariance,
      amountEarned / handsPlayed
    ),
    expectedValue: amountEarned / hoursPlayed,
    houseEdge: -result.amountEarned / result.amountWagered,
    stdDeviation: Math.sqrt(bankrollVariance),
  };
}

// HACK: Distributes hands between cores by changing the CLI arg value.
function adjustHandsCliArg() {
  let handsIndex = process.argv.indexOf('--hands');

  if (handsIndex === -1) {
    process.argv.push('--hands');
    process.argv.push(SETTINGS_DEFAULTS.hands.toString());
    handsIndex = process.argv.length - 2;
  }

  const totalHands =
    handsIndex === -1
      ? SETTINGS_DEFAULTS.hands
      : parseInt(process.argv[handsIndex + 1]);

  const maxCores = cpus().length;
  const cpuCount = process.env.CORES
    ? Math.min(parseInt(process.env.CORES), maxCores)
    : maxCores;

  if (totalHands < cpuCount) {
    return {
      handsIndex,
      handsPerCore: 1,
      cores: totalHands,
      remainingHands: 0,
    };
  }

  const handsPerCore = Math.floor(totalHands / cpuCount);
  const remainingHands = totalHands - handsPerCore * cpuCount;

  return {
    handsIndex,
    handsPerCore,
    cores: cpuCount,
    remainingHands,
  };
}

function getCoresResults(
  options: Partial<CliSimulatorSettings & CliSettings>
): Promise<SimulatorResult[]> {
  const {
    handsIndex,
    handsPerCore,
    remainingHands,
    cores,
  } = adjustHandsCliArg();
  const results: SimulatorResult[] = [];

  // Avoid spawning child processes if only one core is available.
  if (cores === 1) {
    results.push(new Simulator(parseEnums(options)).run());
    return Promise.resolve(results);
  }

  return new Promise((resolve) => {
    for (let i = 0; i < cores; i += 1) {
      process.argv[handsIndex + 1] = (i === 0
        ? handsPerCore + remainingHands
        : handsPerCore
      ).toString();

      const child = fork(process.argv[1], [
        process.argv[2],
        'child',
        ...process.argv.slice(3),
      ]);

      child.on('message', (message) => {
        results.push(message as SimulatorResult);

        if (results.length === cores) {
          resolve(results);
        }
      });
    }
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
  if (options.help || options.h) {
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

  if (process.argv[3] === 'child') {
    process.send?.(simulator.run());
  } else {
    if (
      typeof simulator.settings.hands !== 'number' ||
      simulator.settings.hands < 1
    ) {
      return;
    }

    printIntro(simulator.intro, simulator.settings.hands);

    const formatResult = createResultFormatter(options.raw ?? false);

    getCoresResults(options).then((results) => {
      printResult(formatResult(augmentResult(mergeResults(results))));
    });
  }
}
