<p align="center">
  <img src="https://github.com/mhluska/blackjack-simulator/raw/master/preview.gif" alt="Preview" />
</p>

# Blackjack Simulator

<a href="https://github.com/mhluska/blackjack-simulator/actions"><img src="https://github.com/mhluska/blackjack-simulator/workflows/tests/badge.svg?branch=master" alt="Build Status" /></a>
<a href="https://www.npmjs.com/package/@blackjacktrainer/blackjack-simulator"><img src="https://img.shields.io/npm/v/@blackjacktrainer/blackjack-simulator.svg" alt="Version"></a>
<a href="https://github.com/mhluska/blackjack-simulator/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mhluska/blackjack-simulator" alt="License"></a>

> Practice card counting using Hi-Lo and calculate EV for any table conditions

## Features

- Simulator mode for computing EV given some table conditions (10M hands / second)
- Game mode for practicing basic strategy and card counting with hints
- No package dependencies
- Runs in any JS environment (CLI, browser, React Native app etc)
- Multi-core support in Node

## Usage

### Simulator mode

```sh
npm install -g @blackjacktrainer/blackjack-simulator
```

```sh
blackjack-simulator simulate --help
```

Override the number of CPU cores used:

```sh
CORES=1 blackjack-simulator simulate
```

### Game mode

```sh
blackjack-simulator game --help
```

See it live as a web app [here](https://blackjacktrainer.app).

### Build and run locally

```sh
npm install
nvm use --install
NODE_ENV=development npm run build
./bin/cli.js
```

### Use as a library (simulator mode)

```js
import { Simulator } from "@blackjacktrainer/blackjack-simulator";

// Default settings:
const settings = {
  debug: false,

  // Simulator-only settings:
  hands: 10 ** 7,
  // Can be one of:
  // 'basic-strategy': play perfect basic strategy
  // 'basic-strategy-i18': play perfect basic strategy plus illustrious 18
  // 'basic-strategy-i18-fab4': play perfect basic strategy plus illustrious 18 + fab 4
  playerStrategy: "basic-strategy-i18-fab4",

  playerBetSpread: [1000, 2000, 4000, 8000, 16000],
  playerSpots: [1, 1, 1, 1, 1],
  playerTablePosition: 1,
  playerBankroll: 1000 * 10 ** 7,
  playerWongOutTrueCount: null,

  // Table rules
  allowDoubleAfterSplit: true,
  allowLateSurrender: true,
  allowResplitAces: false,
  blackjackPayout: "3:2",
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: 1000 * 100,
  minimumBet: 1000,
  playerCount: 1,
  penetration: 0.75,
};

const simulator = new Simulator(settings);
const result = simulator.run();
```

Result contains the following data:

```
{
  amountEarned: number;
  amountWagered: number;
  bankrollMean: number;
  bankrollRqd: number;
  bankrollVariance: number;
  handsLost: number;
  handsPlayed: number;
  handsPushed: number;
  handsWon: number;
  hoursPlayed: number;
  riskOfRuin: number;
  timeElapsed: number;
}
```

### Use as a library (game mode)

```js
import {
  Event,
  Game,
  GameStep,
  PlayerInputReader,
} from "@blackjacktrainer/blackjack-simulator";

// Default settings:
const settings = {
  autoDeclineInsurance: false,
  disableEvents: false,
  checkDeviations: false,

  // Can be one of 'default', 'pairs', 'uncommon', 'deviations'. If the mode is set to 'deviations', `checkDeviations`
  // will be forced to true.
  mode: "default",
  debug: false,

  playerBankroll: 1000 * 10 ** 7,
  playerTablePosition: 1,
  playerStrategyOverride: {},

  // Table rules
  allowDoubleAfterSplit: true,
  allowLateSurrender: false,
  allowResplitAces: false,
  blackjackPayout: "3:2",
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: 1000 * 100,
  minimumBet: 1000,
  playerCount: 1,
  penetration: 0.75,
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
game.on(Event.Change, (name, value) => {
  state[name] = value;
});

game.on(Event.Shuffle, () => {
  console.log("End of shoe, cards shuffled!");
});

// Emitted when the game wants to save optional game statistics.
// `entityName` can be one of `hand-result` or `move`.
// `data` is a plain object with values to save to the backend.
game.on(Event.CreateRecord, (entityName, data) => {
  fetch(`/api/v1/${entityName}`, {
    method: "POST",
    body: JSON.serialize(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
});

function stepGame(game, playerInputReader, input) {
  const step = game.step(input);

  if (
    ![
      GameStep.WaitingForPlayInput,
      GameStep.WaitingForInsuranceInput,
      GameStep.WaitingForNewGameInput,
    ].includes(step)
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => playerInputReader.readInput(resolve));
}

async function runGame(game) {
  game.betAmount = 10 * 100;

  const playerInputReader = new PlayerInputReader();
  let input;

  while (true) {
    input = await stepGame(game, playerInputReader, input);
  }
}

runGame(game);
```

`PlayerInputReader.readInput` listens for a `click` or `keypress`
event on `document.body`. Your DOM just has to declare the following buttons
somewhere for user interaction:

```jsx
{
  game.state.step === GameStep.WaitingForPlayInput && (
    <>
      <button data-action="s">Stand (S)</button>
      <button data-action="h">Hit (H)</button>
      <button data-action="d">Double (D)</button>
      <button data-action="r">Surrender (R)</button>
      <button data-action="p">Split (P)</button>
    </>
  );
}
{
  game.state.step === GameStep.WaitingForInsuranceInput && (
    <>
      <button data-action="n">No (N)</button>
      <button data-action="y">Yes (Y)</button>
    </>
  );
}
{
  game.state.step === GameStep.WaitingForNewGameInput && (
    <>
      <button data-action="d">Deal (press any key)</button>
    </>
  );
}
```
