// Shim that makes @napi-rs/canvas compatible with the 'canvas' npm package API.
// pdfjs-dist v3 does require('canvas') internally for rendering support.
const napiCanvas = require('@napi-rs/canvas');

module.exports = {
  createCanvas: napiCanvas.createCanvas,
  Image: napiCanvas.Image,
  ImageData: napiCanvas.ImageData,
  DOMMatrix: napiCanvas.DOMMatrix,
  Path2D: napiCanvas.Path2D,
};
