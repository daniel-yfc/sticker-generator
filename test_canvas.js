const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><canvas id="c" width="400" height="400"></canvas>');
const canvas = dom.window.document.getElementById('c');
const ctx = canvas.getContext('2d');

// JSDOM does not fully implement canvas, it might just return null.
// If node-canvas is installed, it might work.
console.log(ctx ? "Canvas supported" : "Canvas not fully supported");
