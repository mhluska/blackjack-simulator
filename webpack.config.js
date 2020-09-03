const path = require('path');
const merge = require('webpack-merge');

const common = {
  mode: process.env.NODE_ENV || 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};

function resolutions(target) {
  return {
    alias: {
      'player-input-reader': path.resolve(
        __dirname,
        'src',
        target,
        'player-input-reader.js'
      ),
    },
  };
}

const serverConfig = merge(common, {
  entry: './src/node/index.js',
  target: 'node',
  output: {
    filename: 'main.node.js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: resolutions('node'),
});

const clientConfig = merge(common, {
  entry: './src/browser/index.js',
  output: {
    filename: 'main.js',
    library: 'BlackjackEngine',
    libraryTarget: 'umd',
  },
  resolve: resolutions('browser'),
  devServer: {
    contentBase: './dist',
  },
});

module.exports = [serverConfig, clientConfig];
