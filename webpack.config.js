/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const merge = require('webpack-merge');

const common = {
  mode: process.env.NODE_ENV || 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.ts'],
  },
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
};

function resolutions(target) {
  return {
    alias: {
      'player-input-reader': path.resolve(
        __dirname,
        'src',
        target,
        'player-input-reader.ts'
      ),
    },
  };
}

const serverConfig = merge(common, {
  entry: {
    game: './src/node/commands/game.ts',
    simulate: './src/node/commands/simulate.ts',
  },
  target: 'node',
  output: {
    filename: '[name].js',
  },
  resolve: resolutions('node'),
});

const serverMinConfig = merge(serverConfig, {
  output: {
    filename: '[name].min.js',
    libraryExport: 'default',
  },
  optimization: {
    minimize: true,
  },
});

const clientConfig = merge(common, {
  entry: './src/browser/index.ts',
  output: {
    filename: '[name].js',
    library: 'BlackjackEngine',
  },
  resolve: resolutions('browser'),
  devServer: {
    contentBase: './dist',
  },
});

const clientMinConfig = merge(clientConfig, {
  output: {
    filename: '[name].min.js',
  },
  optimization: {
    minimize: true,
  },
});

module.exports = [serverConfig, serverMinConfig, clientConfig, clientMinConfig];
