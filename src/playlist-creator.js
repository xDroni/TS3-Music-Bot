const fs = require('fs');
const {getSrcPath} = require('./utils');

const ROOT_DIR = `${getSrcPath()}/playlists/`;

function createPlaylist(playlistName, author) {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${ROOT_DIR}${playlistName}.json`, JSON.stringify({
            playlistName,
            author,
            songs: []
        }, null, 2), (err) => {
            if (err) {
                reject('Failed creating playlist');
            } else {
                resolve('Playlist created successfully');
            }
        });
    });
}

function addToPlaylist(url, title, playlistName) {
    return new Promise((resolve, reject) => {
        fs.readFile(`${ROOT_DIR}${playlistName}.json`, (err, data) => {
            if (data) {
                let json = JSON.parse(data);

                if (json.songs.some(e => e.url === url)) {
                    reject('Song exists, not added');
                }

                json.songs.push({
                    title,
                    url
                });

                fs.writeFile(`${ROOT_DIR}${playlistName}.json`, JSON.stringify(json, null, 2), (err) => {
                    if (err) {
                        reject('Failed adding song to the playlist');
                    } else {
                        resolve('Song added to the playlist successfully');
                    }
                });
            } else {
                reject(`Playlist ${playlistName}.json not found`);
            }
        });
    });

}

async function getPlaylists() {
    const files = await fs.promises.readdir(`${ROOT_DIR}`);
    let arr = [];
    for (const file of files) {
        const data = await fs.promises.readFile(`${ROOT_DIR}${file}`);
        const json = JSON.parse(data);
        arr.push(json);

    }
    return arr.length === 0 ? null : arr;
}

// createPlaylist('DOPE2', 'dx droni');
// addToPlaylist('link', 'tytul', 'DOPE2');
// getPlaylists().then(res => console.log(res));


module.exports = {getPlaylists, addToPlaylist, createPlaylist};