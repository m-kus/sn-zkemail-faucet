const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Add fallbacks
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer'),
    stream: require.resolve('stream-browserify'),
    timers: require.resolve('timers-browserify'),
    assert: require.resolve('assert'),
    process: require.resolve('process'),
    vm: require.resolve('vm-browserify'),
    os: require.resolve('os-browserify'),
    'process/browser': require.resolve('process/browser')
  };

  // Force using the ES Module version of psl
  config.resolve.alias = {
    ...config.resolve.alias,
    // This forces webpack to use the ESM version of psl
    'psl': path.resolve(__dirname, 'node_modules/psl/dist/psl.mjs')
  };

  // Configure webpack to properly handle ESM
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
    resolve: {
      fullySpecified: false
    }
  });

  // Add buffer and process polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '')
      switch (mod) {
        case 'buffer':
          resource.request = 'buffer'
          break
        case 'stream':
          resource.request = 'readable-stream'
          break
        default:
          throw new Error(`Not found ${mod}`)
      }
    }),
  ];

  return config;
};
