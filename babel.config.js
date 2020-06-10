module.exports = (api) => {
  const isNode = api.caller((caller) => caller && caller.target === 'node');

  return {
    plugins: [
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      ...(isNode ? [] : ['@babel/transform-runtime']),
    ],
    presets: [
      [
        '@babel/preset-env',
        {
          // See https://babeljs.io/docs/en/babel-preset-env#usebuiltins
          // useBuiltIns: 'entry',

          // caller.target will be the same as the target option from webpack
          targets: isNode
            ? { node: 'current' }
            : { browsers: 'last 2 versions' },
        },
      ],
    ],
  };
};
