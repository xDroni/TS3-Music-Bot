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
    championMastery(leagueJs, summonerName, region ='eun1') {
        leagueJs.Summoner
            .gettingByName(summonerName, region)
            .then(data => {
                leagueJs.ChampionMastery.gettingBySummoner(data.id, region).then(data => {
                    let championsMap;
                    leagueJs.StaticData.gettingChampions(region).then(receivedMap => {
                        championsMap = receivedMap.keys;
                        for(let i=0; i<5; i++) {//5 best champions
                            console.log(data[i].championPoints, championsMap[data[i].championId])
                        }
                    });
                }).catch(err => {
                    console.log(err);
                })
            })
            .catch(err => {
                'use strict';
                console.log(err);
            });
    }
};