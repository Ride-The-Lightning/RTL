import 'zone.js';

(window as any).global = window;
window.global.Buffer = window.global.Buffer || require('buffer').Buffer;
