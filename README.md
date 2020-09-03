<p align="center">
  <a href="https://blackjacktrainer.app/" target="_blank">
    <img width="450" src="https://github.com/mhluska/blackjack-engine/raw/master/preview.gif" alt="Preview" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mhluska/blackjack-engine/actions"><img src="https://github.com/mhluska/blackjack-engine/workflows/tests/badge.svg?branch=master" alt="Build Status" /></a>
  <a href="https://www.npmjs.com/package/@blackjacktrainer/blackjack-engine"><img src="https://img.shields.io/npm/v/@blackjacktrainer/blackjack-engine.svg" alt="Version"></a>
  <a href="https://github.com/mhluska/blackjack-engine/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mhluska/blackjack-engine" alt="License"></a>
</p>

<p align="center">
  Core game logic for a Blackjack basic strategy and card counting trainer.
</p>

## Goals

* Easy to play many hands quickly
* Basic strategy and card counting deviation hints
* No package dependencies
* Runs in Node or browser

## Install

```sh
npx @blackjacktrainer/blackjack-engine
```

## Build

```sh
npm install
npm run build
```

## Run in CLI mode

```sh
npm start
```

## Use as a library in the browser

```js
import BlackjackEngine from '@blackjackjs/engine';

// The following are default settings:
const settings = {
  animationDelay: 200,
  deckCount: 2,
  allowSurrender: false,
  allowLateSurrender: false,
  checkDeviations: false,
  // Can be one of 'default', 'pairs', 'uncommon', 'illustrious18'.
  gameMode: 'default',
};

const game = new BlackjackEngine(settings);

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

// Emitted when the engine wants to save optional game statistics.
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
      await game.step({ betAmount: 100 * 100 });
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
