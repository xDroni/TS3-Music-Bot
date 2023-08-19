const stream = require('./audio-stream');
const speaker = require('speaker');
const {sendChannelMessage} = require("./utils");

class AudioHandler {

  /** @param {string} url
   * @param {string} userName
   * @param {string} title
   * @param {TeamSpeakClient} client
   */
  constructor(url, userName, title, client) {
    this.url = url;
    this.userName = userName;
    this.title = title;
    this.client = client;
  }

  /** @param {Function} onEnd */
  play(onEnd) {
    this.s = stream(this.url, this.client)
        .pipe(new speaker({
          channels: 2,          // 2 channels
          bitDepth: 16,         // 16-bit samples
          sampleRate: 44100,
          highWaterMark: 1 << 25
        }));

    this.s.on('error', (e) => {
      console.error(e);
      sendChannelMessage(this.client, e.message);

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
