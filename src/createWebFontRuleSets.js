const postcss           = require('postcss');
const {
  createFontFaceSrcProperty,
  createFontFaceSrcPropertyWithEOT
} = require('./createFontFaceSrc');


/**
 * Creates rulesets of web font.
 *
 * @param {string}  iconFont    target icon font.
 * @param {object}  rulesets    Rulesets of PostCSS object.
 * @param {object}  glyphs      glyphs of web font.
 * @param {object}  options     generating font options.
 */
module.exports = (iconFont, rulesets, glyphs, options) => {

  // inserts new src property
  rulesets.fontFaceRule.insertAfter(iconFont.srcDecl, postcss.decl({
    prop: 'src',
    value: createFontFaceSrcProperty(iconFont, options)
  }));

  // No contains eot format?
  if (options.formats.indexOf('eot') === -1) {

    // Remove src property
    iconFont.srcDecl.remove();

  } else {

    // Replace src property
    iconFont.srcDecl.replaceWith({
      prop: 'src',
      value: createFontFaceSrcPropertyWithEOT(iconFont, options)
    });

  }

  // creates class prefix names
  const useClassNamePrefix = options.classNamePrefix ? `${options.classNamePrefix}-` : '';
  const useClassNamePrefixBefore = options.classNamePrefixBefore ? `${options.classNamePrefixBefore}-` : '';
  const useClassNamePrefixAfter = options.classNamePrefixAfter ? `${options.classNamePrefixAfter}-` : '';

  // append base ruleset
  const iconRule = postcss.rule({
    selectors: [
      `[class^='${useClassNamePrefix}${iconFont.fontName}-']::before`,
      `[class*=' ${useClassNamePrefix}${iconFont.fontName}-']::before`,
      `[class^='${useClassNamePrefix}${useClassNamePrefixBefore}${iconFont.fontName}-']::before`,
      `[class*=' ${useClassNamePrefix}${useClassNamePrefixBefore}${iconFont.fontName}-']::before`,
      `[class^='${useClassNamePrefix}${useClassNamePrefixAfter}${iconFont.fontName}-']::after`,
      `[class*=' ${useClassNamePrefix}${useClassNamePrefixAfter}${iconFont.fontName}-']::after`,
    ]
  });
  iconRule.append({
    prop: 'font-family',
    value: `'${iconFont.fontName}', sans-serif`
  },
  {
    prop: 'font-style',
    value: 'normal'
  },
  {
    prop: 'font-weight',
    value: 'normal'
  },
  {
    prop: 'font-variant',
    value: 'normal'
  },
  {
    prop: 'text-transform',
    value: 'none'
  },
  {
    prop: 'line-height',
    value: '1'
  },
  {
    prop: 'vertical-align',
    value: `${options.verticalAlign}`
  },
  {
    prop: '-webkit-font-smoothing',
    value: 'antialiased'
  },
  {
    prop: '-moz-osx-font-smoothing',
    value: 'grayscale'
  }
  );
  rulesets.root.insertAfter(rulesets.fontFaceRule, iconRule);


  let baseRule = iconRule;

  // append glyphs
  glyphs.forEach((glyph) => {

    [
      {
        prefix: useClassNamePrefix,
        pseudo: 'before',
      },
      {
        prefix: `${useClassNamePrefix}${useClassNamePrefixBefore}`,
        pseudo: 'before',
      },
      {
        prefix: `${useClassNamePrefix}${useClassNamePrefixAfter}`,
        pseudo: 'after',
      },
    ].forEach((classNamingConvention) => {

      const fontRule = postcss.rule({
        selector: `.${classNamingConvention.prefix}${iconFont.fontName}-${glyph.name}::${classNamingConvention.pseudo}`,
      });
      fontRule.append({
        prop: 'content',
        value: glyph.content
      });

      // insert ruleset
      rulesets.root.insertAfter(baseRule, fontRule);

      // replace base ruleset
      baseRule = fontRule;

    });

  });

};
