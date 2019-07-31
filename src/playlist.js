const AudioHandler = require('./yt-audio-stream');

/** @type {AudioHandler[]} */
let queue = [];

/** @type {AudioHandler | undefined} */
let current;


function playNext() {
    current = queue.shift();
    if( !current ) {
        console.log('playlist finished');
        return;
    }
    
    console.log('Playing:', current.url);
    
    current.play(error => {
        if(error)
            console.error(error);
        playNext()
    });
}

module.exports = {
    /** @param {string} song_url */
    add(song_url) {
        let audio_handler = new AudioHandler(song_url);
        queue.push( audio_handler );
        
        if( !current )//no song currently playing
            playNext();
    },

    /*get() {
        if(queue.length !== 0)
            return queue.shift();
        else {
            console.log('playlist is empty');
            return 'https:\/\/youtube.com';
        }
    },*/

    getSize() {
        return queue.length;
    }
};
