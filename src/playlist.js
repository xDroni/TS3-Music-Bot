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

app.use('/getPlaylist', (req, res) => {
    const data = getPlaylist();
    res.send(data);
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
    if(previous === undefined) {
        previous = {
            curr: current,
            prev: null
        }
    }
    else {
        previous = {
            curr: current,
            prev: previous.curr
        }
    }

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

function getPlaylist() {
    let result = [];
    for(let i=0; i<queue.length; i++) {
        result.push(queue[i])
    }
    return result
}

function getPrevious() {
    if(!previous)   return null;
    else            return previous.prev;

}

module.exports = {
    /** @param {string} song_url
     * @param {string} clientName
     * @param {string} title
     */
    add(song_url, clientName, title) {
        let audio_handler = new AudioHandler(song_url, clientName, title);
        queue.push( audio_handler );

        socketHandler('songAdded', `Song ${title} added to the playlist by ${clientName}`);
        
        if( !current )//no song currently playing
            playNext();
    },

    skipCurrent() {
        if(!current) {
            console.log('Queue is empty');
            return false;
        } else {
            socketHandler('skipCurrent', `Song ${current.title} skipped by ${current.clientName}`);
            current.finish();
            return true;
        }
    },

    skipLast() {
        if(queue.length === 0) {
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

    getCurrent() {
        return current;
    },

    getPrevious
};
