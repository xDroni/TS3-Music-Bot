const YouTube = require('simple-youtube-api');
const config = require('./config.json');

// put your YouTube Data v3 GoogleAPIKey.json in secrets folder

if (!config.GoogleAPIKey)
    console.error('Google API key is missing.');

const youtube = new YouTube(config.GoogleAPIKey);

module.exports = youtube;
