const stream = require('youtube-audio-stream');
const decoder = require('lame').Decoder;
const speaker = require('speaker');

class AudioHandler {
    
    /** @param {string} url */
    constructor(url) {
        this.url = url;
    }
    
    /** @param {Function} onEnd */
    play(onEnd) {
        let s = stream(this.url)
            .pipe(decoder())
            .pipe(new speaker());
        
        s.on('error',(e) => onEnd(e));
        //s.on('finish',() => onEnd());
        s.on('close',() => onEnd());
    }
}

module.exports = AudioHandler;