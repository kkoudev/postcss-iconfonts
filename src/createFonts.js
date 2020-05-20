const path              = require('path');
const glob              = require('glob');
const fontGenerator     = require('./font_generator');

/**
 * Creates icon fonts.
 *
 * @param {object} iconFont   icon font options.
 * @param {object} rulesets   Rulesets of PostCSS object.
 * @param {object} options    web font options.
 * @returns {Promise} returns glyphs when successed.
 */
module.exports = (iconFont, rulesets, options) => {

  // Empty font src?
  if (!iconFont.src) {

    // noop
    return Promise.resolve();

  }

  const files   = [].concat(glob.sync(iconFont.src));

  // Empty files?
  if (files.length === 0) {

    // noop
    return Promise.resolve();

  }

  return new Promise((resolve, reject) => {

    fontGenerator({
      files,
      dest: path.resolve(options.outputPath),
      cachePath: options.cachePath,
      fontOptions: {
        formats: options.formats,
        fontName: iconFont.fontName,
        fontHeight: options.fontHeight,
        ascent: options.ascent,
        descent: options.descent,
        normalize: options.normalize,
        centerHorizontally: options.centerHorizontally,
        fixedWidth: options.fixedWidth,
        fixedHash: options.fixedHash,
        startUnicode: options.startUnicode,
        prependUnicode: options.prependUnicode,
      }
    }).then((glyphs) => {

      resolve(glyphs);

    }).catch((error) => {

      reject(error);

    });

  });

};
