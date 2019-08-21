const LeagueJS = require('leaguejs');

const fs = require('fs');
const path = require('path');

// const utils = require('./utils');
const { getSrcPath } = require('./utils');

// put your RiotAPIKey in secrets folder
try {
    const APIKey = fs.readFileSync(path.join(getSrcPath(), '..', 'secrets', 'RiotAPIKey' ), 'utf-8');
    module.exports = new LeagueJS(APIKey, {
        PLATFORM_ID: 'eun1'
    });
} catch(err) {
    console.error('Put your RiotAPIKey into secrets/RiotAPIKey');
    console.error(err);
}


