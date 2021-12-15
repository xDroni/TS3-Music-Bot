const ytdl = require('youtube-dl-exec');
const fetch = require("node-fetch");
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');
const {sendChannelMessage, isYouTubeLink} = require("./utils");

if (config.ffmpegExecutablePath)
  ffmpeg.setFfmpegPath(config.ffmpegExecutablePath);

const ytdlOptions = {
  dumpSingleJson: true,
  noPlaylist: true,
  abortOnError: true,
  playlistEnd: 1,
  youtubeSkipDashManifest: true,
};

async function stream(url, client) {
  return ytdl(url, {
    ...ytdlOptions,
    ...(config.cookiesEnabled && isYouTubeLink(url)) && {cookie: `${__dirname}/cookies.txt`}
  }).then(output => {
    if (output?.url) return output.url;
    else if (output?.requested_formats) return output?.requested_formats.filter(f => f.format.includes("audio"))[0].url;
    else return output.entries.filter(f => f.format.includes("audio"))[0].url;
  }).then(url => fetch(url)).then(res => res.body).then(body => ffmpeg().input(body)
      .addOption('-f s16le')
      .addOption('-acodec pcm_s16le')
      .addOption('-ac 2')
      .addOption('-ar 44100')
      .on('error', (err) => err));
}

module.exports = stream;
