#!/usr/bin/env node

// See https://stackoverflow.com/a/52551910/659910
function camelize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toLowerCase());
}

function parseArgValue(value) {
  // If the value is empty or is actually the next arg, this means the previous
  // arg had no value and should be treated as true.
  // For example `$ simulator simulate --double-after-split --hands 10000`
  if (!value || value[0] === '-') {
    return true;
  }

  if (value[0] >= '0' && value[0] <= '9') {
    return parseInt(value.replace(/[^\d]/g, ''));
  }

  return value;
}

function parseArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = camelize(args[i]);
    const value = parseArgValue(args[i + 1]);

    options[arg] = value;

    if (value !== true) {
      i += 1;
    }
  }

  return options;
}

const commandNames = ['simulate', 'game'];

if (!commandNames.includes(process.argv[2])) {
  console.log('Usage: simulator [command] [options]');
  console.log();
  console.log('Commands:');
  console.log(commandNames.map((c) => `  ${c}`).join('\n'));

  return;
}

const options = parseArgs(process.argv.slice(3));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const command = require(`../dist/${process.argv[2]}`).default;

command(options);
