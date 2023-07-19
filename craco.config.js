const AddCharsetWebpackPlugin = require('add-charset-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      // Adding the AddCharsetWebpackPlugin because when compiling the charset is being stripped out which
      // was causing FontAwesomeIcons to not render properly
      // https://stackoverflow.com/questions/67295527/fontawesome-webfonts-sometimes-not-loading-since-webpack-build 
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
