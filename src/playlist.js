module.exports  = class Playlist {
    constructor() {
        this.playlist = [];
    }

    add(song) {
        this.playlist.push(song);
    }

    get() {
        if(this.playlist.length !== 0)
            return this.playlist.shift();
        else {
            console.log('playlist is empty');
            return 'https:\/\/youtube.com';
        }
    }

    getSize() {
        return this.playlist.length;
    }
};
