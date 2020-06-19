import Utils from './utils.js';
import singleDeckStandsSoft17 from './charts/1-deck-s-soft-17.js';
import singleDeckHitsSoft17 from './charts/1-deck-h-soft-17.js';
import doubleDeckHitsSoft17 from './charts/2-deck-h-soft-17.js';

// TODO: Add more basic strategy charts.
// TODO: Should this only be used for the first card?
const CHARTS = {
  1: {
    // See https://wizardofodds.com/blackjack/images/bj_1d_s17.gif
    standsSoft17: singleDeckStandsSoft17,
    hitsSoft17: singleDeckHitsSoft17,
  },

  2: {
    hitsSoft17: doubleDeckHitsSoft17,
  },
};

export default class BasicStrategyChecker {
  static getChart(settings) {
    // TODO: Handle case where chart doesn't exist for deck counts.
    // TODO: Allow configuring hits/stands soft 17. Not too important since most
    // tables hit soft 17.
    return CHARTS[settings.deckCount].hitsSoft17;
  }

  static getChartType(hand) {
    if (hand.hasPairs) {
      return 'splits';
    } else if (hand.isSoft) {
      return 'soft';
    } else {
      return 'hard';
    }
  }

  static check(game, input) {
    const hand = game.state.focusedHand;
    const chart = this.getChart(game.settings);
    const chartType = this.getChartType(hand);

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

    // NOTE: This should never happen but just in case.
    if (!dealerHints) {
      return `Warning: unable to find hint for ${playerTotal} vs ${dealersCard}`;
    }

    const correctMove = dealerHints[dealersCard];

    let hint;

    // TODO: Add rationale for each hint.
    if (correctMove === 'H' && input !== 'hit') {
      hint = 'hit';
    }

    if (correctMove === 'S' && input !== 'stand') {
      hint = 'stand';
    }

    if (correctMove === 'Dh' && input !== 'double') {
      hint = 'double (or hit if not allowed)';
    }

    if (correctMove === 'Ds' && input !== 'double') {
      hint = 'double (or stand if not allowed)';
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

    if (correctMove === 'Rh' && input !== 'surrender') {
      hint = 'surrender (or hit if not allowed)';
    }

    if (correctMove === 'Rs' && input !== 'surrender') {
      hint = 'surrender (or stand if not allowed)';
    }

    if (hint) {
      return {
        code: correctMove,
        hint: `Last play should have been ${hint}!`,
      };
    } else {
      return {
        code: null,
        hint: null,
      };
    }
  }
}
