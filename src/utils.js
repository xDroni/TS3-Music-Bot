const prompt = require('prompt-sync')();
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const replace = require('replace-in-file');
const PropertiesReader = require('properties-reader');
const {TeamSpeakClient} = require("node-ts");
const LeagueJS = require('leaguejs');

const queuesMap = {
    0: 'Custom game',
    400: 'Summoner\'s Rift 5v5 Draft Pick',
    420: 'Summoner\'s Rift 5v5 Ranked Solo',
    430: 'Summoner\'s Rift 5v5 Blind Pick',
    440: 'Summoner\'s Rift 5v5 Ranked Flex',
    450: 'Howling Abyss 5v5 ARAM'
};

/** @param {string} str */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// https://stackoverflow.com/a/19700358
function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
        days = Math.floor(duration / (1000 * 60 * 60 * 24));

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    days = (days < 10) ? "0" + days : days;

    return days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds";
}

function isYouTubeLink(url) {
    const regexp = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
    return regexp.test(url);
}

function isLink(url) {
  return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/.test(url);
}

function getSrcPath() {
    return path.dirname(process.mainModule.filename);
}

async function processLineByLine(path) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    let output = [];
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        console.log(`Line from file: ${line}`);
        output.push(line);
    }
    return output;
}

function appendToFile(path, value) {
    let stream = fs.createWriteStream(path, {flags: 'a'});
    stream.write(value.toString() + '\n');
    stream.end();
    processLineByLine(path).then(res => console.log(res));
}

function writeFile(path, value) {
    let stream = fs.createWriteStream(path, {flags: 'w'});
    stream.write(value.toString() + '\n');
    stream.end();
}

async function replaceInFile(path, searchValue, replaceValue) {
    const options = {
        files: path,
        from: searchValue,
        to: replaceValue,
    };
    try {
        const results = await replace(options);
        console.log('Replacement results:', results);
    } catch (err) {
        console.error('Error occurred with replacing file: ', err);
    }
}

function getProperty(path, propertyName) {
    let properties = PropertiesReader(path);
    return properties.get(propertyName);
}

function setProperty(path, propertyName, value) {
    let properties = PropertiesReader(path);
    properties.set(propertyName, value);
    return properties.save(path);
}

module.exports = {
    getSrcPath,
    msToTime,
    escapeRegExp,
    processLineByLine,
    appendToFile,
    writeFile,
    replaceInFile,
    setProperty,
    getProperty,
    isYouTubeLink,
    isLink,

    /** @param {string} name */
    getArgument(name) {
        for (let arg of process.argv) {
            let regexp = new RegExp(`^${escapeRegExp(name)}`);
            if (arg.match(regexp))
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
        let max_digits = championMastery.slice(0, 5).map(ch => ch.championPoints.toString().length).reduce((a, b) => Math.max(a, b));
        return championMastery.slice(0, 5).map(ch => {
            let points = ch.championPoints.toString();
            return points + ''.padEnd((max_digits - points.length) * 2 + 1, ' ') + championsMap[ch.championId];
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
        let data = await leagueJs.Summoner.gettingByName(summonerName, region);
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
        return leagueJs.Spectator.gettingActiveGame(summonerName, region);
    },

    /**
     *
     * @param {LeagueJS} leagueJs
     * @param {string} summonerId
     * @param {string} region
     * @returns {Promise<Bluebird<LeagueEntryDTO[]>>}
     */
    async getLeague(leagueJs, summonerId, region = leagueJs.config.PLATFORM_ID) {
        return leagueJs.League.gettingEntriesForSummonerId(summonerId, region);
    },

    /**
     *
     * @param {LeagueJS} leagueJs
     * @param {string} region
     * @returns {Promise<Bluebird<ChampionListDTO<ChampionDTO>>|Bluebird<ChampionListDTO<ChampionFullDTO>>>}
     */
    async getChampionsMap(leagueJs, region = leagueJs.config.PLATFORM_ID) {
        return leagueJs.StaticData.gettingChampions(region);
    },

    async getAccountId(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
        let data = await leagueJs.Summoner.gettingByName(summonerName, region);
        return data.accountId;
    },

    async getMatchById(leagueJs, matchId, region = leagueJs.config.PLATFORM_ID) {
        return leagueJs.Match.gettingById(matchId, region);
    },

    async getMatchListById(leagueJs, accountId, region = leagueJs.config.PLATFORM_ID) {
        let riftCodes = [];
        Object.entries(queuesMap).filter(entry => {
            return (entry[1].includes('Rift'));
        }).forEach(v => {
            riftCodes.push(v[0]);
        });

        return leagueJs.Match.gettingListByAccount(accountId, region, {
            queue: riftCodes,
            endIndex: 10
        });
    }
};