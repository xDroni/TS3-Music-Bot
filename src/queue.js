const AudioHandler = require('./audio-handler');
const {shuffleArray} = require('./common');

/** @type {AudioHandler[]} */
let queue = [];

/** @type {AudioHandler | undefined} */
let current;

/** @type {{AudioHandler} | undefined} */
let previous;

/** @type {AudioHandler[]} */
let playlist = [];

let client;

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
    }, client);
}


function getCurrent() {
    return current || null;
}

function getPrevious() {
    if (!previous) return null;
    else return previous.prev;

}

function addSong(song_url, clientName, title, _client) {
    let audio_handler = new AudioHandler(song_url, clientName, title, _client);
    queue.push(audio_handler);

    if (!current)//no song currently playing
        playNext();
}

function mix() {
    shuffleArray(playlist);
}

function getList() {
    return queue.concat(playlist);
}

function addPlaylist(p, clientName, mix, _client) {
    for (const song of p) {
        playlist.push(new AudioHandler(song.url, clientName, song.title, _client));
    }

    if(mix) {
        this.mix();
    }

    if (!current)//no song currently playing
        playNext();
}

module.exports = {
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
        if (queue.length === 0 && playlist.length === 0 && !current) {
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
    addPlaylist,
    mix,
    getList
};
