const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');

if(config.ffmpegExecutablePath)
  ffmpeg.setFfmpegPath(config.ffmpegExecutablePath);

function stream(url) {
  const video = ytdl(url);

  return ffmpeg()
      .input(video)
      .addOption('-f s16le')
	.on('error', (err) => {
		console.log('An error occured ' + console.error(err))
	})
}

module.exports = stream;
