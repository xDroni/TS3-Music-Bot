const LeagueJS = require('leaguejs');
const config = require('./config.json');


if (!config.RiotAPIKey) {
    console.error('RiotAPIKey is missing.');
} else {
    try {
        module.exports = new LeagueJS(config.RiotAPIKey, {
            PLATFORM_ID: 'eun1'
        });
    } catch (err) {
        console.error(err);
    }
}
