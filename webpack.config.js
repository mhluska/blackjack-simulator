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
    extensions: ['.ts', '.js'],
  },
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
};

const serverConfig = merge(common, {
  entry: {
    game: './src/node/commands/game.ts',
    simulate: './src/node/commands/simulate.ts',
  },
  target: 'node',
  output: {
    filename: '[name].js',
  },
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
  entry: './src/index.ts',
  output: {
    filename: '[name].js',
    library: 'BlackjackSimulator',
  },
  devServer: {
    contentBase: './dist',
  },
});

const clientMinConfig = merge(common, {
  output: {
    filename: '[name].min.js',
    library: 'BlackjackSimulator',
  },
  optimization: {
    minimize: true,
  },
});

module.exports = [serverConfig, serverMinConfig, clientConfig, clientMinConfig];
