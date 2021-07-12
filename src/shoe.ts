import Utils from './utils';
import Deck from './deck';
import Game from './game';
import DiscardTray, { DiscardTrayAttributes } from './discard-tray';
import Card from './card';
import BasicStrategyChecker from './basic-strategy-checker';
import { illustrious18Deviations } from './hi-lo-deviation-checker';
import { GameSettings } from './game';
import {
  Ranks,
  chartTypes,
  entries,
  playerTotal,
  cardValue,
  cardValueToRank,
} from './types';

// TODO: When simulating a large number of hands, this can sometimes still run
// out of cards. Figure out why.
// When there are less than 35% cards in the shoe, a shuffle + reset is needed.
const RESET_THRESHOLD = 0.35;

type ShoeAttributes = {
  penetration: number;
  hiLoRunningCount: number;
  hiLoTrueCount: number;
};

// TODO: Make this mix in functionality from `DiscardTray` instead of extending.
export default class Shoe extends DiscardTray {
  static entityName = 'shoe';

  hiLoRunningCount: number;
  deckCount: GameSettings['tableRules']['deckCount'];
  mode: GameSettings['mode'];
  checkTopNDeviations: GameSettings['checkTopNDeviations'];
  cards: Card[];

  constructor(game: Game) {
    super();

    this.hiLoRunningCount = 0;
    this.deckCount = game.settings.tableRules.deckCount;
    this.mode = game.settings.mode;
    this.checkTopNDeviations = game.settings.checkTopNDeviations;
    this.cards = this._setupCards();
    this.shuffle();
  }

  shuffle(): void {
    Utils.arrayShuffle(this.cards);

    if (this.mode === 'pairs') {
      this._setupPairsMode();
    }

    if (this.mode === 'uncommon') {
      this._setupUncommonMode();
    }

    if (this.mode === 'illustrious18') {
      this._setupIllustrious18Mode();
    }
  }

  drawCard({ showingFace = true } = {}): Card | void {
    const card = this.cards.pop();
    if (!card) {
      return;
    }

    card.showingFace = showingFace;

    if (showingFace) {
      this.hiLoRunningCount += card.hiLoValue;
    }

    this.emitChange();

    return card;
  }

  addCards(cards: Card[]): void {
    this.hiLoRunningCount -= Utils.hiLoValue(cards);
    super.addCards(cards);
  }

  removeCards(): Card[] {
    this.hiLoRunningCount += Utils.hiLoValue(this.cards);
    return super.removeCards();
  }

  attributes(): ShoeAttributes & DiscardTrayAttributes {
    return Object.assign({}, super.attributes(), {
      penetration: Utils.round(this.penetration, 2),
      hiLoRunningCount: this.hiLoRunningCount,
      hiLoTrueCount: Utils.round(this.hiLoTrueCount, 2),
    });
  }

  get maxCards(): number {
    return this.deckCount * 52;
  }

  get needsReset(): boolean {
    if (this.mode !== 'default') {
      return true;
    }

    return this.cards.length / this.maxCards < RESET_THRESHOLD;
  }

  get cardsRemaining(): number {
    return this.cards.length / this.maxCards;
  }

  get penetration(): number {
    return (1 - this.cardsRemaining) * 100;
  }

  get decksRemaining(): number {
    return this.cardsRemaining * this.deckCount;
  }

  get hiLoTrueCount(): number {
    return this.hiLoRunningCount / this.decksRemaining;
  }

  _setupCards(): Card[] {
    const decks = [];
    for (let i = 0; i < this.deckCount; i += 1) {
      decks.push(new Deck(this));
    }

    let cards: Card[] = [];
    while (decks.length > 0) {
      const deck = decks.pop();
      if (deck) {
        cards = cards.concat(...deck.cards);
      }
    }

    return cards;
  }

  _moveCardsToFront(
    playerRank1: Ranks,
    playerRank2: Ranks,
    dealerUpcardValue?: number
  ): void {
    // Move the first two cards to the 0th and 2nd spot so they are dealt to the
    // player at the start of the game.
    Utils.arrayMove(
      this.cards,
      this.cards.findIndex((card) => card.rank === playerRank1),
      this.cards.length - 1
    );

    if (dealerUpcardValue) {
      Utils.arrayMove(
        this.cards,
        this.cards.findIndex((card) => card.value === dealerUpcardValue),
        this.cards.length - 1 - 1
      );
    }

    Utils.arrayMove(
      this.cards,
      this.cards.findIndex((card) => card.rank === playerRank2),
      this.cards.length - 1 - 2
    );
  }

  _playerTotalToTwoCardRanks(
    total: playerTotal,
    chartType: chartTypes
  ): [Ranks, Ranks] {
    const [rank1, rank2] = this._playerTotalToTwoCardValues(total, chartType);
    return [cardValueToRank(rank1), cardValueToRank(rank2)];
  }

  _playerTotalToTwoCardValues(
    total: playerTotal,
    chartType: chartTypes
  ): [cardValue, cardValue] {
    switch (chartType) {
      case 'hard': {
        const value = total > 11 ? 10 : 2;
        return [value, total - value] as [cardValue, cardValue];
      }

      case 'soft':
        return [11, total - 11] as [cardValue, cardValue];

      default:
      case 'splits':
        return [total, total] as [cardValue, cardValue];
    }
  }

  _setupPairsMode(): void {
    const rank = Deck.randomRank();
    this._moveCardsToFront(rank, rank);
  }

  _setupUncommonMode(): void {
    const [chartType, chart] = Utils.arraySample(
      entries(BasicStrategyChecker.uncommonHands(this.deckCount))
    );
    const [playerTotal, dealerUpcardValues] = Utils.arraySample(entries(chart));

    // TODO: Remove this once we have uncommon values defined for all charts.
    if (!dealerUpcardValues) {
      return;
    }

    const dealerUpcardValue = Utils.arraySample(dealerUpcardValues);
    const [rank1, rank2] = this._playerTotalToTwoCardRanks(
      playerTotal,
      chartType
    );

    this._moveCardsToFront(rank1, rank2, dealerUpcardValue);
  }

  _setupIllustrious18Mode(): void {
    const {
      insurance,
      playerTotal,
      dealersCard,
      index,
      pair,
    } = Utils.arraySample(
      illustrious18Deviations.slice(0, this.checkTopNDeviations)
    );

    let total = insurance ? (Utils.random(2, 20) as playerTotal) : playerTotal;

    // TODO: Make the splits format just equal the player total so we don't have
    // to do this awkward division and type cast.
    if (pair) {
      total = (total / 2) as playerTotal;
    }

    const [rank1, rank2] = this._playerTotalToTwoCardRanks(
      total,
      pair ? 'splits' : 'hard'
    );

    this._moveCardsToFront(rank1, rank2, dealersCard);

    // Include all face up cards in the count from the opening hand.
    const i1 = this.cards[this.cards.length - 1].hiLoValue;
    const i2 = this.cards[this.cards.length - 2].hiLoValue;
    const i3 = this.cards[this.cards.length - 3].hiLoValue;

    // We artificially set the running count so that the true count works out
    // to what is required to act on the current illustrious 18 deviation. We
    // use the formula `true_count = running_count / decks_remaining`. We are
    // careful to subtract the next 3 cards from the running count since they
    // are about to be drawn by the dealer.
    let runningCount =
      Utils.rangeBoundary(index) *
        (((this.maxCards - 3) * this.deckCount) / this.maxCards) -
      i1 -
      i2 -
      i3;

    // Since we forced the true count to a nice number, the running count will
    // be an ugly decimal. We round it up or down depending on whether the
    // illustrious 18 deviation acts on indices going further negative or
    // positive.
    runningCount = Math[index.includes('<') ? 'floor' : 'ceil'](runningCount);

    // Force the true count one point less for the '<' comparison since it
    // is an exclusive equality check.
    if (index.includes('<')) {
      runningCount -= this.decksRemaining;
    }

    // Half time time we randomly alter the running count to something
    // incorrect to be able to test the users knowledge.
    if (Utils.random(0, 1) === 0) {
      runningCount += this.decksRemaining * (index.includes('<') ? 1 : -1);
    }

    this.hiLoRunningCount = runningCount;
  }
}
