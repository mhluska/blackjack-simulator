import Utils from './utils';
import Game, { settings as gameSettings, GameSettings } from './game';
import Hand from './hand';
import { selectCharts } from './charts/utils';
import {
  ChartType,
  CheckResult,
  Move,
  ChartMove,
  UncommonChart,
  chartMoveToCorrectMove,
  GameStep,
} from './types';

const CHART_MIN_MAX: Record<ChartType, [number, number]> = {
  [ChartType.Hard]: [7, 18],
  [ChartType.Soft]: [13, 20],
  [ChartType.Splits]: [2, 11],
};

function chartMinMax(chartType: ChartType): [number, number] {
  return CHART_MIN_MAX[chartType];
}

let cachedSubCharts: Record<ChartType, ChartMove[][]> | undefined;

export default class BasicStrategyChecker {
  static uncommonHands(settings: GameSettings): UncommonChart {
    return selectCharts(settings).uncommon;
  }

  static suggest(game: Game, hand: Hand): Move {
    if (game.state.step === GameStep.WaitingForInsuranceInput) {
      return Move.NoInsurance;
    }

    if (!cachedSubCharts) {
      const { chart: chartGroup } = selectCharts(gameSettings);
      const hard = chartGroup.get(ChartType.Hard);
      const soft = chartGroup.get(ChartType.Soft);
      const splits = chartGroup.get(ChartType.Splits);

      if (!hard || !soft || !splits) {
        throw new Error('Subchart not found');
      }

      cachedSubCharts = {
        [ChartType.Hard]: hard,
        [ChartType.Soft]: soft,
        [ChartType.Splits]: splits,
      };
    }

    const chartType = this._chartType(hand);
    const [chartMin, chartMax] = chartMinMax(chartType);

    const playerTotal = Utils.clamp(
      hand.allowSplit ? hand.cards[0].value : hand.cardTotal,
      chartMin,
      chartMax,
    );

    const chart = cachedSubCharts[chartType];

    const dealerHints = chart[playerTotal - chartMin];
    const dealersCard = game.dealer.upcard.value;
    const correctMove = dealerHints[dealersCard - 2];

    if (
      correctMove === ChartMove.DoubleOrHit ||
      correctMove === ChartMove.DoubleOrStand
    ) {
      if (hand.allowDouble) {
        return Move.Double;
      } else {
        return correctMove === ChartMove.DoubleOrHit ? Move.Hit : Move.Stand;
      }
    }

    if (
      correctMove === ChartMove.SplitOrHit ||
      correctMove === ChartMove.SplitOrDouble ||
      correctMove === ChartMove.SplitOrStand
    ) {
      if (gameSettings.allowDoubleAfterSplit) {
        return Move.Split;
      } else {
        switch (correctMove) {
          case ChartMove.SplitOrHit:
            return Move.Hit;
          case ChartMove.SplitOrDouble:
            return Move.Double;
          case ChartMove.SplitOrStand:
            return Move.Stand;
        }
      }
    }

    if (correctMove === ChartMove.SurrenderOrSplit) {
      return hand.allowSurrender ? Move.Surrender : Move.Split;
    }

    if (
      correctMove === ChartMove.SurrenderOrHit ||
      correctMove === ChartMove.SurrenderOrStand
    ) {
      if (hand.allowSurrender) {
        return Move.Surrender;
      } else {
        return correctMove === ChartMove.SurrenderOrHit ? Move.Hit : Move.Stand;
      }
    }

    return chartMoveToCorrectMove(correctMove);
  }

  static check(game: Game, hand: Hand, input: Move): CheckResult {
    const correctMove = this.suggest(game, hand);
    if (!correctMove) {
      return { result: true, code: null, hint: null };
    }

    let hint;

    // TODO: Add rationale for each hint.
    if (correctMove === Move.NoInsurance && input !== Move.NoInsurance) {
      hint = 'decline insurance';
    }

    if (correctMove === Move.Hit && input !== Move.Hit) {
      hint = 'hit';
    }

    if (correctMove === Move.Stand && input !== Move.Stand) {
      hint = 'stand';
    }

    if (correctMove === Move.Double && input !== Move.Double) {
      hint = 'double';
    }

    if (correctMove === Move.Split && input !== Move.Split) {
      hint = 'split';
    }

    if (correctMove === Move.Surrender && input !== Move.Surrender) {
      hint = 'surrender';
    }

    if (!hint) {
      return { result: true, code: null, hint: null };
    }

    return {
      result: false,
      code: correctMove,
      hint: `Basic strategy: last play should have been ${hint}!`,
    };
  }

  static _chartType(hand: Hand): ChartType {
    if (hand.allowSplit) {
      return ChartType.Splits;
    } else if (hand.isSoft) {
      return ChartType.Soft;
    } else {
      return ChartType.Hard;
    }
  }
}
