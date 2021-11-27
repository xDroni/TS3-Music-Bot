const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');
const {sendChannelMessage} = require("./utils");

if (config.ffmpegExecutablePath)
  ffmpeg.setFfmpegPath(config.ffmpegExecutablePath);

let cookies = config.cookiesString;
if (!cookies && Array.isArray(config.cookiesArray) && config.cookiesArray.length > 0) {
  try {
    cookies = config.cookiesArray;
    cookies = cookies.map((cookie) => {
      if (!cookie.name || !cookie.value) {
        throw "wrong cookiesArray in config, expected array of objects, each containing at least name and value";
      }
      return `${cookie.name}=${cookie.value}`;
    }).join(';');
    config.cookiesString = cookies;
    fs.writeFile(`${__dirname}/config.json`, JSON.stringify(config, null, 2), (err) => {
      if (err) return console.error(err);
    });
  } catch (e) {
    console.error(e);
  }
}

function stream(url, client) {
  const video = ytdl(url, {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
    filter: format => format.container === 'webm' && format.audioQuality === "AUDIO_QUALITY_MEDIUM",
    requestOptions: {
      headers: {
        Cookie: cookies
      }
    }
  });

  return ffmpeg()
      .input(video)
      .addOption('-f s16le')
      .addOption('-acodec pcm_s16le')
      .addOption('-ac 2')
      .addOption('-ar 44100')
      .on('error', (err) => {
        if (err.message.includes("410")) {
          err.message += "\nMost probably age restricted video, set valid cookie in config file to avoid this error";
          sendChannelMessage(client, err.message);
        }
      });
}

module.exports = stream;
