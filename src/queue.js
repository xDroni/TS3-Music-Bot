const AudioHandler = require('./audio-handler');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');
const port = 9000;
//Socket setup
const app = express();
const server = app.listen(port, () => console.log('listening to requests on port 9000'));
const io = socket(server);
app.use(cors());

app.use('/getData', (req, res) => {
    const data = {
        playlist: getPlaylist(),
        previous: getPrevious(),
        current: getCurrent()
    };
    res.send(data);
});

io.on('connection', data => {
    data.on('addAgain', data => {
        add(data.previous.url, data.previous.clientName, data.previous.title);
    });
});


/** @type {AudioHandler[]} */
let queue = [];

/** @type {AudioHandler | undefined} */
let current;

/** @type {{AudioHandler} | undefined} */
let previous;

function socketHandler(event, data) {
    io.sockets.emit(event, data);
}

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
        console.log('playlist finished');
        return;
    }

    console.log('Playing:', current.title, 'requested by', current.clientName);

    current.play(error => {
        if (error)
            console.error(error);

        playNext();
    });
}

function getPlaylist() {
    let result = [];
    for (let i = 0; i < queue.length; i++) {
        result.push(queue[i]);
    }
    return result.length > 0 ? result : null;
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

    socketHandler('songAdded', {
        info: `Song ${title} added to the playlist by ${clientName}`,
        current: getCurrent(),
        playlist: getPlaylist(),
    });
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
            let temp = current;
            current.finish();
            socketHandler('skipCurrent', {
                info: `Song ${temp.title} skipped by ${temp.clientName}`,
                playlist: getPlaylist(),
                current: getCurrent(),
                previous: getPrevious(),
            });
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
