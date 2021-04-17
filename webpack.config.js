const path = require('path');
const merge = require('webpack-merge');

const OUTPUT_NAME = 'main';
const OUTPUT_NAME_NODE = `${OUTPUT_NAME}.node`;

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
    filename: `${OUTPUT_NAME_NODE}.js`,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: resolutions('node'),
});

const serverMinConfig = merge(serverConfig, {
  output: {
    filename: `${OUTPUT_NAME_NODE}.min.js`,
  },
  optimization: {
    minimize: true,
  },
});

const clientConfig = merge(common, {
  entry: './src/browser/index.js',
  output: {
    filename: `${OUTPUT_NAME}.js`,
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
    filename: `${OUTPUT_NAME}.min.js`,
  },
  optimization: {
    minimize: true,
  },
});

module.exports = [serverConfig, serverMinConfig, clientConfig, clientMinConfig];
