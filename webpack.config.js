const webpack = require("webpack");

module.exports = {
  resolve: {
    extensions: [ '.ts', '.js' ],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    }),
  ]
};
