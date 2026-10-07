// Metro applies babel-preset-expo implicitly; Jest needs it spelled out to transform app code.
module.exports = function babelConfig(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
