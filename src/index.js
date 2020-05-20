/**
 * @file Generate iconfonts from stylesheets - entry point
 */
const postcss   = require('postcss');
const rulesets  = require('./rulesets');
const cssrulesets = require('./css_generator');
const font_from_rulesets = require('./css_font_generator');

// default options
const defaultOptions = {

  basePath: './',
  outputPath: './',
  publishPath: '',
  stylesheetPath: './',
  cachePath: '.fontcache.json',
  startUnicode: 0xEA01,
  prependUnicode: false,
  formats: ['eot', 'woff', 'ttf'],
  verticalAlign: 'middle',
  classNamePrefix: 'iconfont',
  classNamePrefixBefore: 'before',
  classNamePrefixAfter: 'after',
  cachebuster: 'hash',
  cachebusterFixed: '',
  glyphNormalizer: glyph => glyph

};

const defaultExport = postcss.plugin('postcss-webfont', (options) => {

  const usingOptions = Object.assign({}, defaultOptions, options);

  return (root) => {

    return rulesets(root, usingOptions);

  };

});

defaultExport.onlyCss = postcss.plugin('postcss-webfont-css', (options) => {

  const usingOptions = Object.assign({}, defaultOptions, options);

  return (root) => {

    return cssrulesets(root, usingOptions);

  };

});

defaultExport.onlyFont = postcss.plugin('postcss-webfont-font', (options) => {

  const usingOptions = Object.assign(
    { contentIconMatch: /.+\.svg/ },
    defaultOptions,
    options
  );

  return (root) => {

    return font_from_rulesets(root, usingOptions);

  };

});


module.exports = defaultExport;
