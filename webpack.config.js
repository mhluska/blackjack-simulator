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
  optimization: {
    minimize: false,
  },
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-mnap' : false,
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
  entry: {
    game: './src/node/index.js',
    simulate: './src/node/simulate.js',
  },
  target: 'node',
  output: {
    filename: '[name].js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: resolutions('node'),
});

const serverMinConfig = merge(serverConfig, {
  output: {
    filename: '[name].min.js',
  },
  optimization: {
    minimize: true,
  },
});

const clientConfig = merge(common, {
  entry: './src/browser/index.js',
  output: {
    filename: '[name].js',
    library: 'BlackjackEngine',
    libraryTarget: 'umd',
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
