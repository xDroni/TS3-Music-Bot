const stream = require('./audio-stream');
const speaker = require('speaker');

class AudioHandler {
    
    /** @param {string} url
     * @param {string} clientName
     * @param {string} title
     */
    constructor(url, clientName, title) {
        this.url = url;
        this.clientName = clientName;
        this.title = title
    }
    
    /** @param {Function} onEnd */
    play(onEnd) {
        this.s = stream(this.url)
            .pipe(new speaker());
        
        this.s.on('error',(e) => {
            onEnd(e)
        });
        this.s.on('close',(e) => {
            onEnd(e)
        });
    }

    finish() {
        console.log('skipping');
        this.s.end();
    }
}

module.exports = AudioHandler;
