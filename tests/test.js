const stream = require('youtube-audio-stream');
const url = 'http://youtube.com/watch?v=dt7BbfsGbZI';
const decoder = require('lame').Decoder;
const speaker = require('speaker');

stream(url)
    .pipe(decoder())
    .pipe(new speaker());
