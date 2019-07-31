const stream = require('youtube-audio-stream');
const url = 'http://youtube.com/watch?v=34aQNMvGEZQ';
const decoder = require('lame').Decoder;
const speaker = require('speaker');

stream(url)
    .pipe(decoder())
    .pipe(new speaker());
