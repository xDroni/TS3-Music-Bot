const YouTube = require('simple-youtube-api');
const GoogleSecrets = require('../secrets/GoogleAPIKey.json');

// put your YouTube Data v3 GoogleAPIKey.json in secrets folder

if(!GoogleSecrets.APIKey)
  console.error('Google API key is missing.');

const youtube = new YouTube(GoogleSecrets.APIKey);

module.exports = youtube;
