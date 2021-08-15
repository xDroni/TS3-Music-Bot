const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');

if (config.ffmpegExecutablePath)
  ffmpeg.setFfmpegPath(config.ffmpegExecutablePath);

function stream(url) {
  const video = ytdl(url, {
    quality: 'highestaudio', highWaterMark: 1 << 25
  });

  return ffmpeg()
      .input(video)
      .addOption('-f s24le')
      .addOption('-ac 2')
      .addOption('-ar 48000')
      .on('error', err => err);
}

module.exports = stream;
