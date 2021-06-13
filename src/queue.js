const AudioHandler = require('./audio-handler');

/** @type {AudioHandler[]} */
let queue = [];

/** @type {AudioHandler | undefined} */
let current;

/** @type {{AudioHandler} | undefined} */
let previous;

function playNext() {
    current = queue.shift();
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

function add(song_url, clientName, title) {
    let audio_handler = new AudioHandler(song_url, clientName, title);
    queue.push(audio_handler);

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

    getSize() {
        return queue.length;
    },

    getCurrent,
    getPrevious,
    add,
};
