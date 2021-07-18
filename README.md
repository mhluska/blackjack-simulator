<p align="center">
  <a href="https://blackjacktrainer.app/" target="_blank">
    <img width="450" src="https://github.com/mhluska/blackjack-simulator/raw/master/preview.gif" alt="Preview" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mhluska/blackjack-simulator/actions"><img src="https://github.com/mhluska/blackjack-simulator/workflows/tests/badge.svg?branch=master" alt="Build Status" /></a>
  <a href="https://www.npmjs.com/package/@blackjacktrainer/blackjack-simulator"><img src="https://img.shields.io/npm/v/@blackjacktrainer/blackjack-simulator.svg" alt="Version"></a>
  <a href="https://github.com/mhluska/blackjack-simulator/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mhluska/blackjack-simulator" alt="License"></a>
</p>

<p align="center">
  Realistic blackjack simulator (practice card counting and calculate EV for any table conditions)
</p>

## Project goals

* Simulator for computing EV given some table conditions
* Game mode for practicing basic strategy and card counting with hints
* No package dependencies
* Runs in any JS environment (CLI, browser, React Native app etc)

## Usage

### Simulator mode

```sh
npm install -g @blackjacktrainer/blackjack-simulator
```

```sh
blackjack-simulator simulate --help
```

### Game mode

```sh
blackjack-simulator game --help
```

### Build and run locally

```sh
npm install
nvm use --install
NODE_ENV=development npm run build
./bin/cli.js
```

### Use as a library (simulator mode)

```js
import { Simulator } from '@blackjacktrainer/blackjack-simulator';

// The following are default settings:
const settings = {
  // Simulator-only settings:
  hands: 10 ** 5,
  // Can be one of:
  // 'basic-strategy': play perfect basic strategy
  // 'basic-strategy-i18': play perfect basic strategy plus illustrious 18
  playerStrategy: 'basic-strategy',

  debug: false,
  playerTablePosition: 2,
  playerBankroll: minimumBet * 1000 * 1000,

  // Table rules
  allowDoubleAfterSplit: true,
  allowLateSurrender: true,
  blackjackPayout: '3:2',
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: 1000 * 100,
  minimumBet: 10 * 100,
  playerCount: 6,
};

const simulator = new Simulator(settings);
const result = simulator.run({ hands: 10 ** 6 });
```

Result contains the following data:

```
{
  amountWagered: string;
  expectedValue: string;
  handsLost: string;
  handsPlayed: string;
  handsPushed: string;
  handsWon: string;
  houseEdge: string;
  tableRules: string;
  timeElapsed: string;
  variance: string;
}
```

### Use as a library (game mode)

```js
import { Game } from '@blackjacktrainer/blackjack-simulator';

// The following are default settings:
const settings = {
  animationDelay: 200,
  disableEvents: false,
  autoDeclineInsurance: false,
  autoConfirmNewGame: false,
  checkDeviations: false,
  checkTopNDeviations: 18,

  // Can be one of 'default', 'pairs', 'uncommon', 'illustrious18'. If the mode
  // is set to 'illustrious18', `checkDeviations` will be forced to true.
  mode: 'default',
  debug: false,

  playerBankroll: 10000 * 100,
  playerTablePosition: 2,
  playerStrategyOverride: {},

  // Table rules
  allowDoubleAfterSplit: true,
  allowLateSurrender: false,
  blackjackPayout: '3:2',
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: 1000 * 100,
  minimumBet: 10 * 100,
  playerCount: 6,
};

const game = new Game(settings);

// In a real app, this will likely be a React-redux store or a Vuex store.
const state = {};

// Called when any game state changes. `name` will be one of the following:
//
// - focusedHand
// - sessionMovesCorrect
// - sessionMovesTotal
// - playCorrection
// - step
// - shoe
// - discardTray
// - dealer
// - player
// - handWinner
game.on('change', (name, value) => {
  state[name] = value;
});

game.on('shuffle', () => {
  console.log('End of shoe, cards shuffled!');
});

// Emitted when the game wants to save optional game statistics.
// `entityName` can be one of `hand-result` or `move`.
// `data` is a plain object with values to save to the backend.
game.on('create-record', (entityName, data) => {
  fetch(`/api/v1/${entityName}`, {
    method: 'POST',
    body: JSON.serialize(data),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
});

async function startGame(game) {
  while (true) {
    try {
      // `betAmount` is a cent value.
      await game.run({ betAmount: 100 * 100 });
    } catch (error) {
      if (error.message === 'Game reset') {
        continue;
      }

      throw error;
    }
  }
}

startGame(game);
```

```
The game often pauses and listens for a `click` or `keypress` event on
`document.body`. Your DOM just has to declare the following buttons somewhere
for user interaction:

```html
<template v-if="game.state.step === 'waiting-for-move'">
  <button data-action="s">Stand (S)</button>
  <button data-action="h">Hit (H)</button>
  <button data-action="d">Double (D)</button>
  <button data-action="r">Surrender (R)</button>
  <button data-action="p">Split (P)</button>
<template v-else-if="step === 'ask-insurance'">
  <button data-action="n">No (N)</button>
  <button data-action="y">Yes (Y)</button>
</template>
<template v-else>
  <button data-action="d">Deal (press any key)</button>
</template>
```
