const stream = require('youtube-audio-stream');
const decoder = require('lame').Decoder;
const speaker = require('speaker');

class AudioHandler {
    
    /** @param {string} url
     * @param {string} clientName
     */
    constructor(url, clientName) {
        this.url = url;
        this.clientName = clientName;
    }
    
    /** @param {Function} onEnd */
    play(onEnd) {
        this.s = stream(this.url)
            .pipe(decoder())
            .pipe(new speaker());
        
        this.s.on('error',(e) => onEnd(e));
        //s.on('finish',() => onEnd());
        this.s.on('close',() => onEnd());
    }

    finish() {
        console.log('skipping');
        this.s.emit('finish');
    }
}

module.exports = AudioHandler;