import React from 'react';
import YouTubeEmbed from "./YouTube";

function MusicContent(props) {
    let current = props.current;
    let previous  = props.previous;
    let playlist;
    if(props.playlist) {
        playlist = props.playlist.map(item => {
            return <p>{item.title}</p>
        });
    }

    function socketHandler(socket, event, data) {
        if(socket) {
            socket.emit(event, data);
        }
    }

    return (
        <div className="columns is-centered is-mobile">
            <div className="column is-3 is-narrow has-text-centered">
                <p>Previous:</p>
                <p>{previous ? previous.title + ' requested by ' + previous.clientName : 'No previous song'}</p>
                {previous ? <a onClick={socketHandler(props.socket, 'addSong', `Song ${previous.title} added to the playlist by ${previous.clientName}`)}>Add again</a> : null }
            </div>
            <div className="column is-6 is-narrow has-text-centered">
                <p>Current:</p>
                <p>{current ? current.title + ' requested by ' + current.clientName : 'Nothing is playing right now'}</p>
                <div className="video-container">
                    {current ? <YouTubeEmbed videoId={current.url.match("watch\\?v=(.*)")[1]} /> : null }
                </div>
            </div>
            <div className="column is-3 is-narrow has-text-centered">
                <p>In the queue:</p>
                <p>{playlist ? playlist : null}</p>
            </div>
        </div>
    )
}

export default MusicContent;