const AudioHandler = require('./audio-handler');
const {shuffleArray} = require('./utils');

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

    console.log('Playing:', current.title, 'requested by', current.userName);

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

function addSong(song_url, userName, title, _client) {
    let audio_handler = new AudioHandler(song_url, userName, title, _client);
    queue.push(audio_handler);

    if (!current)//no song currently playing
        playNext();
}

function shuffle() {
    shuffleArray(playlist);
}

function getList() {
    return queue.concat(playlist);
}

function addPlaylist(p, userName, shuffle, _client) {
    for (const song of p) {
        playlist.push(new AudioHandler(song.url, userName, song.title, _client));
    }

    if (shuffle) {
        this.shuffle();
    }

    if (!current)//no song currently playing, start the playlist
        playNext();
}

module.exports = {
    skipCurrent() {
        if (!current) {
            console.log('Queue is empty');
            return false;
        } else {
            setTimeout(() => current.finish(), 1)
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
            setTimeout(() => current.finish(), 1)
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
    shuffle,
    getList
};
