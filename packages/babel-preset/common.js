const nonStandardPlugins = require('./non-standard-plugins');

module.exports = function shopifyCommonPreset(api, options = {}) {
  const {
    targets = {
      node: 'current',
    },
    corejs = 3,
    debug = false,
    modules = 'auto',
    typescript = false,
    useBuiltIns = 'entry',
    transformRuntime = false,
    transformRuntimeOptions = {
      corejs: false,
      helpers: true,
      // By default, babel assumes babel/runtime version 7.0.0-beta.0,
      // explicitly resolving to match the provided helper functions.
      // https://github.com/babel/babel/issues/10261
      version: require('@babel/runtime/package.json').version,
      regenerator: true,
      // https://babeljs.io/docs/en/babel-plugin-transform-runtime#useesmodules
      // We should turn this on once the lowest version of Node LTS
      // supports ES Modules.
      useESModules: false,
      // This allows users to run transform-runtime broadly across a whole project.
      // By default, transform-runtime imports from @babel/runtime/foo directly, but
      // that only works if @babel/runtime is in the node_modules of the file that is being compiled.
      absoluteRuntime: false,
    },
  } = options;

  const isNode = 'node' in targets;

  const presets = [
    [
      require.resolve('@babel/preset-env'),
      {
        modules,
        useBuiltIns,
        corejs,
        targets,
        debug,
        bugfixes: true,
      },
    ],
  ];

  const plugins = [
    ...nonStandardPlugins(options),
    isNode && require.resolve('@babel/plugin-proposal-dynamic-import'),
    isNode && require.resolve('@babel/plugin-transform-modules-commonjs'),
    typescript && require.resolve('@babel/preset-typescript'),
    // polyfill for import statements in webpack for browsers that don't support promises
    require.resolve('@babel/plugin-syntax-dynamic-import'),
    // proposal-decorators must go before proposal-class-properties.
    // Typscript implements the stage 1 version of decorators, which is the
    // "legacy" version. When decorators are used in legacy mode,
    // proposal-class-properties must be used in loose mode
    // see https://babeljs.io/docs/en/babel-plugin-proposal-decorators#note-compatibility-with-babel-plugin-proposal-class-properties
    typescript && [
      require.resolve('@babel/plugin-proposal-decorators'),
      {legacy: true},
    ],
    // Enable loose mode to use assignment instead of defineProperty
    typescript && [
      require.resolve('@babel/plugin-proposal-class-properties'),
      {loose: true},
    ],
    // Adds Numeric Separators
    typescript && require.resolve('@babel/plugin-proposal-numeric-separator'),
    // nullish-coalescing and optional-chaining are handled by preset-env
    // But they aren't yet supported in webpack 4 because of missing support
    // in acorn v6 (support is in acorn v7, which is used in webpack v5).
    // So we want to always transpile this synax away
    // See https://github.com/webpack/webpack/issues/10227
    // Can be removed once we drop support for webpack v4 (or these features
    // are backported to acorn v6)
    typescript && [
      require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
      {loose: true},
    ],
    typescript && [
      require.resolve('@babel/plugin-proposal-optional-chaining'),
      {loose: true},
    ],
    // Polyfills the runtime needed for async/await, generators, and friends
    // https://babeljs.io/docs/en/babel-plugin-transform-runtime
    transformRuntime && [
      '@babel/plugin-transform-runtime',
      {
        ...transformRuntimeOptions,
        version: require('@babel/runtime/package.json').version,
      },
    ],
    !typescript && require.resolve('@babel/plugin-proposal-class-properties'),
  ].filter(Boolean);

  return {presets, plugins};
};