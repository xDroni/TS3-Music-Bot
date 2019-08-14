const LeagueJS = require('leaguejs');

const fs = require('fs');
const path = require('path');

const utils = require('./utils');

// put your RiotAPIKey in secrets folder
try {
    const APIKey = fs.readFileSync(path.join(utils.getSrcPath(), '..', 'secrets', 'RiotAPIKey' ), 'utf-8');
    module.exports = new LeagueJS(APIKey);
} catch(err) {
    console.error('Put your RiotAPIKey into secrets/RiotAPIKey');
    console.error(err);
}


