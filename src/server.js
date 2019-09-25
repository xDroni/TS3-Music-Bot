const express = require('express');
const cors = require('cors');
const port = 9000;

module.exports = class Server {
    constructor(playlist) {
        this.Playlist = playlist
        this.app = express();
    }

    run() {
        this.app.use(cors());
        this.app.use('/current', (req, res) => {
            const data = {
                title: 'a',
                clientName: 'b',
                url: 'c',
            };
            res.send(data);
        });

        this.app.listen(port, () => console.log(`Example app listening on port ${port}!`))
    }
}
