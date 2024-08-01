const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');
const { sendChannelMessage } = require('./utils');
const { existsSync } = require('node:fs');

if (config.ffmpegExecutablePath) ffmpeg.setFfmpegPath(config.ffmpegExecutablePath);

let cookies = config?.cookiesString;
if (!cookies) {
  setCookies();
} else {
  console.log('Using cookiesString found in config file.');
}

let ytdl = null;

async function ytdlpInit() {
  const ytdlpExists = existsSync('./yt-dlp');

  if (!ytdlpExists) {
    console.log('Downloading yt-dlp');
    return YTDlpWrap.downloadFromGithub().then(async () => {
      ytdl = new YTDlpWrap('./yt-dlp');
      const version = (await ytdl.execPromise(['--version'])).trim();
      console.log('downloaded the latest version', version);
      return Promise.resolve();
    });
  }

  ytdl = new YTDlpWrap('./yt-dlp');
  const latestVersion = (await YTDlpWrap.getGithubReleases(1))[0].tag_name.trim();
  const currentVersion = (await ytdl.execPromise(['--version'])).trim();

  if (latestVersion !== currentVersion) {
    console.log('updating');
    YTDlpWrap.downloadFromGithub().then(() => {
      console.log('updated to', latestVersion);
      ytdl = new YTDlpWrap('./yt-dlp');
    });
  } else {
    console.log('using the newest version', currentVersion);
  }
}

ytdlpInit();

function setCookies() {
  if (!(Array.isArray(config.cookiesArray) && config.cookiesArray.length > 0)) {
    console.log('Cookies array not found in config file.');
    return '';
  }

  try {
    cookies = config.cookiesArray;
    cookies = cookies
      .map((cookie) => {
        if (!cookie.name || !cookie.value) {
          throw 'Unexpected cookiesArray in config, expected array of objects, each containing at least name and value';
        }
        return `${cookie.name}=${cookie.value}`;
      })
      .join(';');
    config.cookiesString = cookies;
    fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(config, null, 2));
    console.log('Using generated cookiesString from cookiesArray.');
    return cookies;
  } catch (e) {
    console.error(e);
    return '';
  }
}

function stream(url, client) {
  if (ytdl === null) {
    throw Error('Player is not ready yet');
  }
  const audioStream = ytdl.execStream([url, '-f', 'ba*']);

  return ffmpeg()
    .input(audioStream)
    .addOption('-f s16le')
    .addOption('-acodec pcm_s16le')
    .addOption('-ac 2')
    .addOption('-ar 44100')
    .on('error', (err) => {
      if (err.message.includes('410')) {
        err.message += '\nMost likely age-restricted video, set a valid cookie in the config file to play these videos.';
        sendChannelMessage(client, err.message);
      }
      console.error(err);
    });
}

module.exports = stream;
