const path              = require('path');
const stringTemplate    = require('string-template');

// Templates src property by font type
const srcPropertyTemplates = {

  eotIE: 'url(\'{fontPath}.eot{fontHash}\')',
  eot: 'url(\'{fontPath}.eot{fontHash}#iefix\') format(\'embedded-opentype\')',
  woff2: 'url(\'{fontPath}.woff2{fontHash}\') format(\'woff2\')',
  woff: 'url(\'{fontPath}.woff{fontHash}\') format(\'woff\')',
  ttf: 'url(\'{fontPath}.ttf{fontHash}\') format(\'truetype\')',
  svg: 'url(\'{fontPath}.svg{fontHash}#${fontName}\') format(\'svg\')',

};

/**
 * Get template font hash string.
 *
 * @param {string} fontHash use fontHash
 */
const getTemplateFontHash = (fontHash) => {

  return fontHash ? `?${fontHash}` : '';

};



/**
 * Creates font-face src property.
 *
 * @param {object} iconFont icon font properties.
 * @param {object} options  options of generating fonts.
 * @returns {string} font-face src property.
 */
exports.createFontFaceSrcProperty = (iconFont, options) => {

  // Creates font path
  const fontPath = path.relative(
    path.resolve(options.publishPath, options.stylesheetPath),
    path.join(options.outputPath, iconFont.fontName)
  ).replace(/\\/g, path.posix.sep);

  const srcFormats = [];

  // for each formats
  options.formats.forEach((format) => {

    const template = srcPropertyTemplates[format];

    // Is not empty template?
    if (template) {

      srcFormats.push(stringTemplate(template, {
        fontPath,
        fontHash: getTemplateFontHash(iconFont.fontHash),
        fontName: iconFont.fontName
      }));

    }

  });

  // returns src property
  return srcFormats.join(', ');

};

/**
 * Creates font-face src property with EOT.
 *
 * @param {object} iconFont icon font properties.
 * @param {object} options  options of generating fonts.
 * @returns {string} font-face src property.
 */
exports.createFontFaceSrcPropertyWithEOT = (iconFont, options) => {

  // Creates font path
  const fontPath = path.relative(
    path.resolve(options.publishPath, options.stylesheetPath),
    path.join(options.outputPath, iconFont.fontName)
  );

  // returns src property
  return stringTemplate(srcPropertyTemplates.eotIE, {
    fontPath,
    fontHash: getTemplateFontHash(iconFont.fontHash),
    fontName: iconFont.fontName
  });

};