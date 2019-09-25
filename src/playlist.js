const AudioHandler = require('./audio-handler');
const express = require('express');
const socket = require('socket.io');
const port = 9000;
//Socket setup
const app = express();
const server = app.listen(port, () => console.log('listening to requests on port 9000'));
const io = socket(server);

/** @type {AudioHandler[]} */
let queue = [];

/** @type {AudioHandler | undefined} */
let current;

function socketHandler(event, data) {
    io.sockets.emit(event, data);
}

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

        socketHandler('songAdded', {
            url: song_url,
            clientName: clientName,
            title: title,
        });
        
        if( !current )//no song currently playing
            playNext();
    },

    skipCurrent() {
        if(!current) {
            console.log('Queue is empty');
            return false;
        } else {
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
