const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const VueRouteWebpackPlugin = require('../src/index');

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
      },
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new VueRouteWebpackPlugin(),
  ]
}