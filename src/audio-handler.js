const stream = require('./audio-stream');
const speaker = require('speaker');
const {sendChannelMessage} = require("./utils");

class AudioHandler {

  /** @param {string} url
   * @param {string} clientName
   * @param {string} title
   * @param {TeamSpeakClient} client
   */
  constructor(url, clientName, title, client) {
    this.url = url;
    this.clientName = clientName;
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
      if (e.message.includes("410")) {
        e.message += "\nMost probably age restricted video, set valid cookie in config file to avoid this error";
      }
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
