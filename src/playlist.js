const AudioHandler = require('./audio-handler');

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
    
    console.log('Playing:', current.title, 'requested by', current.clientName);

    current.play(error => {
        if(error)
            console.error(error);
        playNext()
    });
}

module.exports = {
    /** @param {string} song_url
     * @param {string} clientName
     * @param {string} title
     */
    add(song_url, clientName, title) {
        let audio_handler = new AudioHandler(song_url, clientName, title);
        queue.push( audio_handler );
        
        if( !current )//no song currently playing
            playNext();
    },

    skip() {
        if(!current) {
            console.log('Playlist is empty');
            return false;
        } else {
            current.finish();
            return true;
        }

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
    },

    getCurrent() {
        return current;
    }
};
