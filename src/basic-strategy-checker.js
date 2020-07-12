import Utils from './utils.js';
import singleDeck from './charts/1-deck';
import doubleDeck from './charts/2-deck';

// TODO: Add more basic strategy charts.
// TODO: Should this only be used for the first card?
const CHARTS = {
  1: singleDeck,
  2: doubleDeck,
};

export default class BasicStrategyChecker {
  static uncommonHands(deckCount) {
    return this._chartData(deckCount).uncommon;
  }

  // Returns undefined if basic strategy was followed correctly.
  // Returns an object with a `correctMove` code and a `hint` otherwise.
  static check(game, input) {
    const hand = game.state.focusedHand;
    const chartGroup = this._chartGroup(game.settings.deckCount);
    const chartType = this._chartType(hand);
    const chart = chartGroup[chartType];

    const keys = Object.keys(chart).map((key) => parseInt(key));
    const chartMin = Math.min(...keys);
    const chartMax = Math.max(...keys);
    const playerTotal = Utils.clamp(
      hand.hasPairs ? hand.cards[0].value : hand.cardTotal,
      chartMin,
      chartMax
    );

    const dealersCard = game.dealer.upcard.value;
    const dealerHints = chart[playerTotal];

    console.assert(
      dealerHints,
      `Warning: unable to find hint for ${playerTotal} vs ${dealersCard}`
    );

    const correctMove = dealerHints[dealersCard];

    let hint;

    // TODO: Add rationale for each hint.
    if (correctMove === 'H' && input !== 'hit') {
      hint = 'hit';
    }

    if (correctMove === 'S' && input !== 'stand') {
      hint = 'stand';
    }

    if (hand.firstMove) {
      if (correctMove === 'Dh' && input !== 'double') {
        hint = 'double (or hit if not allowed)';
      }

      if (correctMove === 'Ds' && input !== 'double') {
        hint = 'double (or stand if not allowed)';
      }
    }

    if (correctMove === 'P' && input !== 'split') {
      hint = 'split';
    }

    if (correctMove === 'Ph' && input !== 'split') {
      hint = 'split (or hit if double after split not allowed)';
    }

    if (correctMove === 'Pd' && input !== 'split') {
      hint = 'split (or double if double after split not allowed)';
    }

    const allowSurrender = this._allowSurrender(hand, game.settings);
    if (correctMove === 'Rh') {
      if (
        (allowSurrender && input !== 'surrender') ||
        (!allowSurrender && input !== 'hit')
      ) {
        hint = 'surrender (or hit if not allowed)';
      }
    }

    if (correctMove === 'Rs') {
      if (
        (allowSurrender && input !== 'surrender') ||
        (!allowSurrender && input !== 'stand')
      ) {
        hint = 'surrender (or stand if not allowed)';
      }
    }

    // TODO: Make this configurable.
    const doubleAfterSplitAllowed = true;
    if (correctMove === 'Rp') {
      if (
        (doubleAfterSplitAllowed && input !== 'split') ||
        (allowSurrender && input !== 'surrender') ||
        (!allowSurrender && input !== 'split')
      ) {
        hint =
          'surrender (or split if not allowed or double after split allowed)';
      }
    }

    if (!hint) {
      return;
    }

    return {
      code: correctMove,
      hint: `Last play should have been ${hint}!`,
    };
  }

  static _allowSurrender(hand, settings) {
    return (
      settings.allowSurrender && (hand.firstMove || settings.allowLateSurrender)
    );
  }

  static _chartData(deckCount) {
    // TODO: Allow configuring hits/stands soft 17. Not too important since most
    // tables hit soft 17.
    // TODO: Add charts for remaining deck counts!
    // - 2 deck (stays soft 17)
    // - 4 deck (stays/hits soft 17)
    // - 6 deck (stays/hits soft 17)
    // - 8 deck (stays/hits soft 17)
    // Add an assert that the chart exists.
    return (CHARTS[deckCount] || CHARTS['2']).hitsSoft17;
  }

  static _chartGroup(deckCount) {
    return this._chartData(deckCount).chart;
  }

  static _chartType(hand) {
    if (hand.hasPairs) {
      return 'splits';
    } else if (hand.isSoft) {
      return 'soft';
    } else {
      return 'hard';
    }
  }
}
