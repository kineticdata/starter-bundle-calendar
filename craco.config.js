const AddCharsetWebpackPlugin = require('add-charset-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [new AddCharsetWebpackPlugin({ charset: 'utf-8' })],
    },
    configure: webpackConfig => {
      // Fix for strict EcmaScript Module error, not fixed in the latest React Scripts (5.0.1 at the time of this
      // comment) without ejecting and making this change. FYI: This is the only reason for Craco to be used.
      // https://github.com/webpack/webpack/issues/11636
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      });

      return webpackConfig;
    },
  },
};
