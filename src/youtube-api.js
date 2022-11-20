const YouTube = require('simple-youtube-api');
const config = require('./config.json');

// put your Google API key in src/config.json file

if (!config.GoogleAPIKey)
  console.error('Google API key is missing.');

const youtube = config?.GoogleAPIKey ? new YouTube(config.GoogleAPIKey) : null;

module.exports = youtube;
