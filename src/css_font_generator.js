const path              = require('path');
const fontGenerator     = require('./font_generator');


/**
 * Process generating web fonts of rulesets.
 *
 * @param {object} root     root of PostCSS.
 * @param {object} options  options of generating fonts.
 * @returns {Promise} promise object.
 */
module.exports = async(root, options) => {
  const contents = [];

  root.walkDecls(
    'content',
    decl => {
      if (!options.iconsBaseMatch.match(decl.value)) return;

      contents.push({
        decl,
        file: decl.value.replace(/^\s*url\(['"]?([^'")])['"]?\)/, '$1')
      });

    }
  );

  if (!contents.length) return;

  const fontResult = await fontGenerator({
    files: contents.map(({ file }) => file),
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
  });

  if (!fontResult) return;

  fontResult.glyphs.forEach(glyph => contents
    .filter(({ file }) => file === glyph.file)
    .forEach(({ decl }) => {
      decl.value = `'\\${glyph.codepoint.toString(16).toUpperCase()}'`;
    })
  );
};
