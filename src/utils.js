const prompt = require('prompt-sync')();
const path = require('path');
const { TeamSpeakClient } = require("node-ts");
const LeagueJS = require('leaguejs');

/** @param {string} str */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSrcPath() {
    return path.dirname(process.mainModule.filename);
}

module.exports = {
    getSrcPath,
    escapeRegExp,

    /** @param {string} name */
    getArgument(name) {
        for (let arg of process.argv) {
            let regexp = new RegExp(`^${escapeRegExp(name)}`);
            if( arg.match(regexp) )
			    return arg.replace(regexp, '').substring(1);
        }

        try {//ask user to type password in console
            return prompt(name + ': ') || '';
        } catch (e) {
            console.error("Argument " + name + " not found. Closing program.");
            process.exit();
            return '';
        }
    },
    
    /**
     * @param {TeamSpeakClient} client
     * @param {string} message
     * */
    sendChannelMessage(client, message) {
        client.send('sendtextmessage', {
            targetmode: 2,//CHANNEL
            target: 0,//current serveradmin channel
            msg: message
        }).catch(console.error);
    },
    
    /**
     * @param {TeamSpeakClient} client
     * @param {number} target_id
     * @param {string} message
     * */
    sendPrivateMessage(client, target_id, message) {
        client.send('sendtextmessage', {
            targetmode: 1,//CLIENT
            target: target_id,//current serveradmin channel
            msg: message
        }).catch(console.error);
    },

    /**
     * @param {LeagueJS} leagueJs
     * @param {string} summonerName
     * @param {string} region
     * */
    async championMastery(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
        let data = await leagueJs.Summoner
            .gettingByName(summonerName, region);
        let championMastery = await leagueJs.ChampionMastery.gettingBySummoner(data.id, region);
        let championsMap;
        let receivedMap = await leagueJs.StaticData.gettingChampions(region);
        championsMap = receivedMap.keys;
        let max_digits = championMastery.slice(0, 5).map(ch => ch.championPoints.toString().length).reduce((a,b) => Math.max(a,b));
        return championMastery.slice(0, 5).map(ch => {
            let points = ch.championPoints.toString();
            return points + ''.padEnd((max_digits-points.length)*2 + 1, ' ') + championsMap[ch.championId];
        });
    },

    /**
     *
     * @param {LeagueJS} leagueJs
     * @param {string} summonerName
     * @param {string} region
     * @returns {string} summonerId
     */

    async getSummonerId(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
        let data = await leagueJs.Summoner.gettingByName(summonerName);
        return data.id;
    },

    /**
     *
     * @param {LeagueJS} leagueJs
     * @param {string} summonerName
     * @param {string} region
     * @returns {Promise<Bluebird<CurrentGameInfo>>}
     */
    async getCurrentMatch(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
        return leagueJs.Spectator.gettingActiveGame(summonerName);
    },

    /**
     *
     * @param {LeagueJS} leagueJs
     * @param {string} summonerId
     * @param {string} region
     * @returns {Promise<Bluebird<LeagueEntryDTO[]>>}
     */
    async getLeague(leagueJs, summonerId, region = leagueJs.config.PLATFORM_ID) {
        return leagueJs.League.gettingEntriesForSummonerId(summonerId);
    },

    /**
     *
     * @param {LeagueJS} leagueJs
     * @param {string} region
     * @returns {Promise<Bluebird<ChampionListDTO<ChampionDTO>>|Bluebird<ChampionListDTO<ChampionFullDTO>>>}
     */
    async getChampionsMap(leagueJs, region = leagueJs.config.PLATFORM_ID) {
        return leagueJs.StaticData.gettingChampions(region);
    }
};