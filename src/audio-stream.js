const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');
const {sendChannelMessage} = require("./utils");

if (config.ffmpegExecutablePath)
  ffmpeg.setFfmpegPath(config.ffmpegExecutablePath);

let cookies = config?.cookiesString
if(!cookies) {
  setCookies();
} else {
  console.log("Using cookiesString found in config file.")
}

function setCookies() {
  if(!(Array.isArray(config.cookiesArray) && config.cookiesArray.length > 0)) {
    console.log("Cookies array not found in config file.");
    return "";
  }

  try {
    cookies = config.cookiesArray;
    cookies = cookies.map((cookie) => {
      if (!cookie.name || !cookie.value) {
        throw "Unexpected cookiesArray in config, expected array of objects, each containing at least name and value";
      }
      return `${cookie.name}=${cookie.value}`;
    }).join(';');
    config.cookiesString = cookies;
    fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(config, null, 2));
    console.log("Using generated cookiesString from cookiesArray.")
    return cookies;
  } catch (e) {
    console.error(e);
    return "";
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
          err.message += "\nMost likely age-restricted video, set a valid cookie in the config file to play these videos.";
          sendChannelMessage(client, err.message);
        }
      });
}

module.exports = stream;
