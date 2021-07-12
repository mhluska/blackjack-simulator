#!/usr/bin/env node

// TODO: Add proper CLI options (support all config options).
if (process.argv.includes('--interactive')) {
  require('../dist/game.js');
} else {
  require('../dist/simulate.js');
}
