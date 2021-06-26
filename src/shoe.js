import Utils from './utils.js';
import Deck from './deck.js';
import GameObject from './game-object.js';
import DiscardTray from './discard-tray.js';
import Card from './card.js';
import BasicStrategyChecker from './basic-strategy-checker.js';
import { illustrious18Deviations } from './hi-lo-deviation-checker.js';

// TODO: When simulating a large number of hands, this can sometimes still run
// out of cards. Figure out why.
// When there are less than 35% cards in the shoe, a shuffle + reset is needed.
const RESET_THRESHOLD = 0.35;

// TODO: Make this mix in functionality from `DiscardTray` instead of extending.
export default class Shoe extends DiscardTray {
  static entityName = 'shoe';

  constructor(game) {
    super();

    this.hiLoRunningCount = 0;
    this.deckCount = game.settings.tableRules.deckCount;
    this.mode = game.settings.mode;
    this.checkTopNDeviations = game.settings.checkTopNDeviations;
    this.cards = this._setupCards();
    this.shuffle();
  }

  shuffle() {
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

  drawCard({ showingFace = true } = {}) {
    const card = this.cards.pop();
    card.showingFace = showingFace;

    if (showingFace) {
      this.hiLoRunningCount += card.hiLoValue;
    }

    this.emitChange();

    return card;
  }

  addCards(cards) {
    this.hiLoRunningCount -= Utils.hiLoValue(cards);
    super.addCards(cards);
  }

  removeCards() {
    this.hiLoRunningCount += Utils.hiLoValue(this.cards);
    return super.removeCards();
  }

  attributes() {
    return Object.assign({}, super.attributes(), {
      penetration: Utils.round(this.penetration, 2),
      hiLoRunningCount: this.hiLoRunningCount,
      hiLoTrueCount: Utils.round(this.hiLoTrueCount, 2),
    });
  }

  get maxCards() {
    return this.deckCount * 52;
  }

  get needsReset() {
    if (this.mode !== 'default') {
      return true;
    }

    // console.log('needs reset?', this.cards.length / this.maxCards < RESET_THRESHOLD, this.cards.length, this.maxCards);

    return this.cards.length / this.maxCards < RESET_THRESHOLD;
  }

  get cardsRemaining() {
    return this.cards.length / this.maxCards;
  }

  get penetration() {
    return (1 - this.cardsRemaining) * 100;
  }

  get decksRemaining() {
    return this.cardsRemaining * this.deckCount;
  }

  get hiLoTrueCount() {
    return this.hiLoRunningCount / this.decksRemaining;
  }

  _setupCards() {
    const decks = [];
    for (let i = 0; i < this.deckCount; i += 1) {
      decks.push(new Deck(this));
    }

    let cards = [];
    while (decks.length > 0) {
      cards = cards.concat(...decks.pop().cards);
    }

    return cards;
  }

  _moveCardsToFront(playerRank1, playerRank2, dealerUpcardValue) {
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
        this.cards.findIndex((card, i) => card.value === dealerUpcardValue),
        this.cards.length - 1 - 1
      );
    }

    Utils.arrayMove(
      this.cards,
      this.cards.findIndex((card, i) => card.rank === playerRank2),
      this.cards.length - 1 - 2
    );
  }

  _twoRandomRanksFromTotal(total, chartType) {
    return this._twoRandomIntegerRanksFromTotal(
      parseInt(total),
      chartType
    ).map((r) => r.toString());
  }

  _twoRandomIntegerRanksFromTotal(total, chartType) {
    if (chartType === 'hard') {
      const rank = total > 11 ? 10 : 2;
      return [rank, total - rank];
    }

    if (chartType === 'soft') {
      return ['A', total - 11];
    }

    if (chartType === 'splits') {
      return [total, total];
    }
  }

  _setupPairsMode() {
    const rank = Deck.randomRank();
    this._moveCardsToFront(rank, rank, null);
  }

  _setupUncommonMode() {
    const [chartType, chart] = Utils.arraySample(
      Object.entries(BasicStrategyChecker.uncommonHands(this.deckCount))
    );
    const [playerTotal, dealerUpcardValues] = Utils.arraySample(
      Object.entries(chart)
    );
    const dealerUpcardValue = Utils.arraySample(dealerUpcardValues);
    const [rank1, rank2] = this._twoRandomRanksFromTotal(
      playerTotal,
      chartType
    );

    this._moveCardsToFront(rank1, rank2, dealerUpcardValue);
  }

  _setupIllustrious18Mode() {
    const {
      insurance,
      playerTotal,
      dealersCard,
      index,
      pair,
    } = Utils.arraySample(
      illustrious18Deviations.slice(0, this.checkTopNDeviations)
    );

    const total = insurance ? Utils.random(2, 20) : playerTotal;
    const [rank1, rank2] = this._twoRandomRanksFromTotal(
      pair ? total / 2 : total,
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
