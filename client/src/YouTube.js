import React from 'react';
import YouTube from 'react-youtube';

export default class YouTubeEmbed extends React.Component {
    render() {
        const options = {
            playerVars: {
                autoplay: 0,
            }
        };

        return (
            <YouTube
                videoId={this.props.videoId}
                opts={options}
                // onReady={this._onReady}
            />
        );
    }

    _onReady(event) {
        event.target.pauseVideo();
    }
}