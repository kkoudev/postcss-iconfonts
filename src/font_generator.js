/**
 * @file Generating fonts.
 */
const fs                        = require('fs-extra');
const path                      = require('path');
const crc                       = require('crc');
const fileCache                 = require('node-file-cache');
const SVGIcons2SVGFontStream    = require('svgicons2svgfont');
const fileSorter                = require('svgicons2svgfont/src/filesorter');
const svg2ttf                   = require('svg2ttf');
const ttf2woff                  = require('ttf2woff');
const ttf2woff2                 = require('ttf2woff2');
const ttf2eot                   = require('ttf2eot');

// Cache key for svg font table
const CACHE_KEY_SVG_FONT_TABLE = 'cacheSVGFontTable';

// defines font generator execuging groups
const EXECUTING_FONT_GENERATORS = [
  'svg',
  'ttf',
  [
    'woff',
    'woff2',
    'eot',
  ]
];

/**
 * Check exixting font files.
 * @param {object} options generating options
 * @returns {boolean} exists font files or not
 */
const existsFontFiles = (options) => {

  try {

    options.fontOptions.formats.forEach((format) => {

      fs.statSync(path.resolve(options.dest, `${options.fontOptions.fontName}.${format}`));

    });

    return true;

  } catch (err) {

    return false;

  }

};

// Font generators.
const FONT_GENERATORS = {

  // SVG font
  svg: (options) => {

    return new Promise((resolve, reject) => {

      const cacheSVGFontTable = options.fileCache.get(CACHE_KEY_SVG_FONT_TABLE) || {};
      const fontStream        = new SVGIcons2SVGFontStream(options.fontOptions);
      const sortedFiles       = options.files.slice(0).sort((file1, file2) => fileSorter(file1, file2));
      const fileMTimes        = {};
      const simpleGlyphs      = [];
      let   fontBuffer        = Buffer.alloc(0);

      // for each sorted files.
      sortedFiles.forEach((file) => {

        // put timestamp of file.
        fileMTimes[file] = fs.statSync(file).mtime.getTime();

      });

      // Get svg font cache
      const cacheSVGFont = cacheSVGFontTable[options.fontOptions.fontName];

      // Has cache?
      // and equals length of fileMTimes?
      if (cacheSVGFont && Object.keys(cacheSVGFont.fileMTimes).length === Object.keys(fileMTimes).length) {

        let isUpdated = false;

        // Font file exists?
        if (existsFontFiles(options)) {

          // for each svg files
          Object.keys(cacheSVGFont.fileMTimes).some((key) => {

            // not equals mtime?
            if (!(key in fileMTimes) || fileMTimes[key] !== cacheSVGFont.fileMTimes[key]) {

              // require updating
              isUpdated = true;

              // break loop
              return true;

            }

            // contnue loop
            return false;

          });

          // Not require updating?
          if (!isUpdated) {

            // append metadata list
            options.glyphs = cacheSVGFont.simpleGlyphs;

            // put font buffer
            options.fontBufferTable.svg = null;
            options.fontBufferTable.svgHash = cacheSVGFont.svgHash;

            // noop
            resolve();
            return;

          }

        } else {

          // Force updated
          isUpdated = true;

        }

      }

      // creates directory
      fs.mkdirsSync(options.dest);

      // setting output font destination.
      fontStream.on('data', (data) => {

        fontBuffer = Buffer.concat([fontBuffer, data]);

      }).on('end', () => {

        // append metadata list
        options.glyphs = simpleGlyphs;

        // creates svg file content
        const svgFileContent = fontBuffer.toString();
        const svgHash = crc.crc32(svgFileContent).toString(16);

        // put font buffer
        options.fontBufferTable.svg = svgFileContent;
        options.fontBufferTable.svgHash = svgHash;

        // cache svg font
        cacheSVGFontTable[options.fontOptions.fontName] = {
          simpleGlyphs,
          fileMTimes,
          svgHash,
        };
        options.fileCache.set(CACHE_KEY_SVG_FONT_TABLE, cacheSVGFontTable);

        // contains svg format?
        if (options.fontOptions.formats.indexOf('svg') === -1) {

          // returns successful
          resolve();

        } else {

          // output svg file
          const writeStream = fs.createWriteStream(path.resolve(options.dest, `${options.fontOptions.fontName}.svg`));

          // output svg file
          writeStream.on('finish', () => {

            // returns successful
            resolve();

          }).on('error', (error) => {

            // returns error
            reject(error);

          });

          // write buffer
          writeStream.write(fontBuffer);
          writeStream.end();

        }

      }).on('error', (error) => {

        // returns error
        reject(error);

      });


      let currentCodePoint = options.fontOptions.startUnicode;

      // for each files
      sortedFiles.forEach((file) => {

        const glyph   = fs.createReadStream(file);
        const name    = path.basename(file, path.extname(file));
        const unicode = String.fromCharCode(currentCodePoint);

        // set metadata
        const metadata = {
          name,
          unicode: [unicode]
        };

        // append metadata
        glyph.metadata = metadata;

        // write file
        fontStream.write(glyph);

        // append simple glyphs
        simpleGlyphs.push({
          name,
          file,
          codepoint: currentCodePoint
        });

        // incremental code point
        currentCodePoint++;

      });

      // close stream
      fontStream.end();

    });

  },

  // TTF font
  ttf: (options) => {

    return new Promise((resolve, reject) => {

      // Not specified svg?
      if (!options.fontBufferTable.svg) {

        // noop
        resolve();
        return;

      }

      // creates directory
      fs.mkdirsSync(options.dest);

      const writeStream = fs.createWriteStream(path.resolve(options.dest, `${options.fontOptions.fontName}.ttf`));

      // Creates svg2ttf data
      const font       = svg2ttf(options.fontBufferTable.svg, {});
      const fontBuffer = Buffer.from(font.buffer);

      // Creates writing buffers
      writeStream.on('finish', () => {

        // put font buffer
        options.fontBufferTable.ttf = fontBuffer;

        // returns successful
        resolve();

      }).on('error', (error) => {

        // returns error
        reject(error);

      });

      // write buffers
      writeStream.write(fontBuffer);
      writeStream.end();

    });

  },

  // WOFF font
  woff: (options) => {

    return new Promise((resolve, reject) => {

      // Not specified ttf?
      if (!options.fontBufferTable.ttf) {

        // noop
        resolve();
        return;

      }

      // creates directory
      fs.mkdirsSync(options.dest);

      const writeStream = fs.createWriteStream(path.resolve(options.dest, `${options.fontOptions.fontName}.woff`));

      // Creates ttf2woff data
      const font       = ttf2woff(new Uint8Array(options.fontBufferTable.ttf), {});
      const fontBuffer = Buffer.from(font.buffer);

      // Creates writing buffers
      writeStream.on('finish', () => {

        // returns successful
        resolve();

      }).on('error', (error) => {

        // returns error
        reject(error);

      });

      // write buffers
      writeStream.write(fontBuffer);
      writeStream.end();

    });

  },

  // WOFF2 font
  woff2: (options) => {

    return new Promise((resolve, reject) => {

      // Not specified ttf?
      if (!options.fontBufferTable.ttf) {

        // noop
        resolve();
        return;

      }

      // creates directory
      fs.mkdirsSync(options.dest);

      const writeStream = fs.createWriteStream(path.resolve(options.dest, `${options.fontOptions.fontName}.woff2`));

      // Creates ttf2woff2 data
      const font       = ttf2woff2(new Uint8Array(options.fontBufferTable.ttf), {});
      const fontBuffer = Buffer.from(font.buffer);

      // Creates writing buffers
      writeStream.on('finish', () => {

        // returns successful
        resolve();

      }).on('error', (error) => {

        // returns error
        reject(error);

      });

      // write buffers
      writeStream.write(fontBuffer);
      writeStream.end();

    });

  },

  // EOT font
  eot: (options) => {

    return new Promise((resolve, reject) => {

      // Not specified ttf?
      if (!options.fontBufferTable.ttf) {

        // noop
        resolve();
        return;

      }

      // creates directory
      fs.mkdirsSync(options.dest);

      const writeStream = fs.createWriteStream(path.resolve(options.dest, `${options.fontOptions.fontName}.eot`));

      // Creates ttf2eot data
      const font       = ttf2eot(new Uint8Array(options.fontBufferTable.ttf), {});
      const fontBuffer = Buffer.from(font.buffer);

      // Creates writing buffers
      writeStream.on('finish', () => {

        // returns successful
        resolve();

      }).on('error', (error) => {

        // returns error
        reject(error);

      });

      // write buffers
      writeStream.write(fontBuffer);
      writeStream.end();

    });

  },

};


/**
 * Execute specified font generator.
 *
 * @param {string} type     font generator type.
 * @param {object} options  font generator options.
 * @returns {Promise} returns Promise of specified font generator.
 */
const executeFontGenerator = (type, options) => {

  const fontGenerator = FONT_GENERATORS[type];

  // Exists font generator?
  if (fontGenerator) {

    // executing font generator
    return fontGenerator(options);

  }

  // reject font generator
  return Promise.reject();

};


/**
 * @param {object} options generating options.
 * @returns {Promise} returns glyphs when successed.
 */
module.exports = (options) => {

  const usingOptions = Object.assign({}, options);

  // append buffer table
  usingOptions.fontBufferTable = {};
  usingOptions.fontOptions.log = () => {}; // eslint-disable-line

  // creates cache directory
  usingOptions.cachePath && fs.mkdirsSync(path.dirname(usingOptions.cachePath));

  // creates file cache
  usingOptions.fileCache = fileCache.create({ file: usingOptions.cachePath });

  return new Promise((resolve, reject) => {

    EXECUTING_FONT_GENERATORS.reduce((prev, current) => {

      return prev.then(() => {

        // current type is Array?
        if (Array.isArray(current)) {

          const promises = current.map((type) => executeFontGenerator(type, usingOptions));

          // parallel executing
          return Promise.all(promises);

        }

        // serial executing
        return executeFontGenerator(current, usingOptions);

      });

    }, Promise.resolve()).then(() => {

      // returns glyphs and svgHash
      resolve({ glyphs: usingOptions.glyphs, svgHash: usingOptions.fontBufferTable.svgHash });

    }).catch((error) => {

      // returns error
      reject(error);

    });

  });

};
