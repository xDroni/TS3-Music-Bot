const LeagueJS = require('../src/league-api');

LeagueJS.updateRateLimiter({allowBursts: true});

async function championMastery(leagueJs, summonerName, region = 'eun1') {
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
}

async function getSummonerId(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
    let data = await leagueJs.Summoner.gettingByName(summonerName);
    return data.id;
}

async function getCurrentMatch(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
     return leagueJs.Spectator.gettingActiveGame(summonerName);
}

async function getLeague(leagueJs, summonerId, region = leagueJs.config.PLATFORM_ID) {
    return leagueJs.League.gettingEntriesForSummonerId(summonerId);
}

async function getChampionsMap(leagueJs, region = leagueJs.config.PLATFORM_ID) {
    return leagueJs.StaticData.gettingChampions(region);
}

getSummonerId(LeagueJS, 'INGAME SUMMONER NAME HERE').then(summonerId => {
    getCurrentMatch(LeagueJS, summonerId).then(activeMatch => {
        console.log(activeMatch.gameMode, activeMatch.gameType);
        activeMatch.participants.forEach(summonerData => {
            getChampionsMap(LeagueJS).then(championsMap => {
                getLeague(LeagueJS, summonerData.summonerId).then(leagueData => {
                    let summonerName = summonerData.summonerName;
                    let champion = '(' + championsMap.keys[summonerData.championId] + ')';
                    let solo = 'RANKED SOLO: UNRANKED';
                    let flex = 'RANKED FLEX: UNRANKED';
                    let tft = 'RANKED TFT: UNRANKED';
                    leagueData.forEach(queue => {
                        if(queue.queueType.includes('SOLO')) solo = solo.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + 'LP');
                        if(queue.queueType.includes('FLEX')) flex = flex.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + 'LP');
                        if(queue.queueType.includes('TFT')) tft = tft.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + 'LP');
                    });
                    console.log(summonerName.padEnd(20, ' ') + champion.padEnd(20, ' ') + solo.padEnd(40, ' ') + flex.padEnd(40, ' ') + tft.padEnd(40, ' '));
                })
            })
        });
    }).catch(err => {
        console.log(err);
        console.log('summoner not ingame');
    })
});