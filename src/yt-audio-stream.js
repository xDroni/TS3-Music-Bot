const stream = require('youtube-audio-stream');
let url;
const decoder = require('lame').Decoder;
const speaker = require('speaker');

class AudioHandler {
    constructor(_url) {
        if(_url === undefined)
            url = 'https://www.youtube.com/watch?v=3ah4t1P9yFA';
        else
            url = _url;
    }

    play() {
        stream(url)
            .pipe(decoder())
            .pipe(new speaker());
    }
}

module.exports = AudioHandler;
