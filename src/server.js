const express = require('express');
const port = 3000;

module.exports = class Server {
    constructor(playlist) {
        this.Playlist = playlist
        this.app = express();
    }

    run() {
        this.app.get('/asd', (req, res) => res.send('asd'));
        this.app.use('/', (req, res) => res.send(this.Playlist.getCurrent().toString()));

        this.app.listen(port, () => console.log(`Example app listening on port ${port}!`))
    }
}
