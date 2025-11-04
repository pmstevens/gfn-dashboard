const path = require('path');
const twemoji = require('twemoji');

// base path relative to index.html where copied svgs live
const TWEMOJI_BASE = './assets/twemoji';

window.twemoji = twemoji;
window.twemojiBase = TWEMOJI_BASE;