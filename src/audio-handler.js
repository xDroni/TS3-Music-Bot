const stream = require('./audio-stream');
const portAudio = require('naudiodon');


class AudioHandler {

  /** @param {string} url
   * @param {string} clientName
   * @param {string} title
   */
  constructor(url, clientName, title) {
    this.url = url;
    this.clientName = clientName;
    this.title = title;
  }

  /** @param {Function} onEnd */
  play(onEnd) {
    const ao = new portAudio.AudioIO({
      outOptions: {
        channelCount: 2,
        sampleFormat: portAudio.SampleFormat24Bit,
        sampleRate: 48000,
        deviceId: -1, // Use -1 or omit the deviceId to select the default device
        closeOnError: true // Close the stream if an audio error is detected, if set false then just log the error
      }
    })

    ao.start();

    this.s = stream(this.url)
        .pipe(ao)

    this.s.on('error', (e) => {
      this.s.destroy();
      onEnd(e);
    });
    this.s.on('finish', () => {
      this.s.destroy();
      onEnd();
    });
  }

  finish() {
    this.s.emit('finish');
  }
}

module.exports = AudioHandler;
