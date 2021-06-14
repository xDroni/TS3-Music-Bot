const AudioHandler = require('./audio-handler');

/** @type {AudioHandler[]} */
let queue = [];

/** @type {AudioHandler | undefined} */
let current;

/** @type {{AudioHandler} | undefined} */
let previous;

/** @type {AudioHandler[]} */
let playlist = [];

function playNext() {
    if (queue.length !== 0) {
        current = queue.shift();
    } else if (playlist.length !== 0) {
        current = playlist.shift();
    } else {
        current = null;
        console.log('No more songs to play.');
        return;
    }

    if (previous === undefined) {
        previous = {
            curr: current,
            prev: null
        };
    } else {
        previous = {
            curr: current,
            prev: previous.curr
        };
    }

    if (!current) {
        console.log('Queue finished');
        return;
    }

    console.log('Playing:', current.title, 'requested by', current.clientName);

    current.play(error => {
        if (error)
            console.error(error);

        playNext();
    });
}


function getCurrent() {
    return current || null;
}

function getPrevious() {
    if (!previous) return null;
    else return previous.prev;

}

function addSong(song_url, clientName, title) {
    let audio_handler = new AudioHandler(song_url, clientName, title);
    queue.push(audio_handler);

    if (!current)//no song currently playing
        playNext();
}

function addPlaylist(p, clientName) {
    for (const song of p) {
        playlist.push(new AudioHandler(song.url, clientName, song.title));
    }

    if (!current)//no song currently playing
        playNext();
}

module.exports = {
    /** @param {string} song_url
     * @param {string} clientName
     * @param {string} title
     */

    skipCurrent() {
        if (!current) {
            console.log('Queue is empty');
            return false;
        } else {
            current.finish();
            return true;
        }
    },

    skipLast() {
        if (queue.length === 0) {
            console.log('Queue is empty');
            return false;
        } else {
            queue.pop();
            return true;
        }
    },

    skipAll() {
        if (queue.length === 0 && playlist.length === 0) {
            console.log('Queue and playlist are empty');
            return false;
        } else {
            queue = [];
            playlist = [];
            current.finish();
            return true;
        }
    },

    getSize() {
        return {queueSize: queue.length, playlistSize: playlist.length};
    },

    getCurrent,
    getPrevious,
    addSong,
    addPlaylist
};
