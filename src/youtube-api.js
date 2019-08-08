const YouTube = require('simple-youtube-api');
const fs = require('fs');
const path = require('path');


const utils = require('./utils');

// put your YouTube Data v3 APIKey in secrets folder
const youtube = new YouTube(fs.readFileSync(path.join(utils.getSrcPath(), '..', 'secrets', 'APIKey' ), 'utf-8'));

module.exports = youtube;