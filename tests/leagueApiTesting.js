const LeagueJS = require('../src/league-api');

const queuesMap = {
    0:      'Custom game',
    400:    'Summoner\'s Rift 5v5 Draft Pick',
    420:    'Summoner\'s Rift 5v5 Ranked Solo',
    430:    'Summoner\'s Rift 5v5 Blind Pick',
    440:    'Summoner\'s Rift 5v5 Ranked Flex',
    450:    'Howling Abyss 5v5 ARAM'
};

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

async function getAccountId(leagueJs, summonerName, region = leagueJs.config.PLATFORM_ID) {
    let data = await leagueJs.Summoner.gettingByName(summonerName);
    return data.accountId;
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

async function getMatchById(leagueJs, matchId, region = leagueJs.config.PLATFORM_ID) {
    return leagueJs.Match.gettingById(matchId, region);
}

async function getMatchListById(leagueJs, accountId, region = leagueJs.config.PLATFORM_ID) {
    let riftCodes = [];
    Object.entries(queuesMap).filter(entry => {
        return (entry[1].includes('Rift'))
    }).forEach(v => {
        riftCodes.push(v[0])
    });

    return leagueJs.Match.gettingListByAccount(accountId, region, {
        queue: riftCodes,
        endIndex: 10
    });
}

const summonerName = 'summoner name';
getAccountId(LeagueJS, summonerName).then(accountId => {
    getMatchListById(LeagueJS, accountId).then(matchList => {
        let sum = 0; let count = 0;
        matchList.matches.forEach(match => {
            sum = count = 0;
            getMatchById(LeagueJS, match.gameId).then(res => {
                res.participants.some((participant, index) => {
                    if((res.participantIdentities[index].player.summonerName).toLowerCase() === summkonerName.toLowerCase() && !match.role.includes('SUPPORT')) {
                        sum += Math.round(((res.participants[index].stats.totalMinionsKilled + res.participants[index].stats.neutralMinionsKilled) / (res.gameDuration / 60)) * 100) / 100;
                        count++;
                        console.log(sum, count);
                        return true;
                    }
                });
            })
        });
        // console.log('average cs / min in last games', summonerName, sum / count);
    })
});

// getMatchById(LeagueJS, id).then(res => {
//     // console.log(res);
//     res.participants.forEach((participant, index) => {
//         console.log(res.participantIdentities[index].player.summonerName);
//         console.log('cs per minute', Math.round(((res.participants[index].stats.totalMinionsKilled + res.participants[index].stats.neutralMinionsKilled) / (res.gameDuration / 60)) * 100) / 100);
//     });
// });

// getAccountId(LeagueJS, 'summoner name').then(accountId => {
//     getMatchListById(LeagueJS, accountId).then(matchList => {
//         getChampionsMap(LeagueJS).then(championsMap => {
//             matchList.matches.forEach(match => {
//                 let championName = championsMap.keys[match.champion];
//                 console.log(championName);
//                 console.log(new Date(match.timestamp).toLocaleDateString("en-US"), new Date(match.timestamp).toLocaleTimeString("en-US"));
//                 console.log(queuesMap[match.queue]);
//                 console.log(match);
//             })
//         })
//     });
// });


// getSummonerId(LeagueJS, 'summoner name').then(summonerId => {
//     getCurrentMatch(LeagueJS, summonerId).then(activeMatch => {
//         console.log(activeMatch.gameMode, activeMatch.gameType);
//         console.log(activeMatch);
//         activeMatch.participants.forEach(summonerData => {
//             getChampionsMap(LeagueJS).then(championsMap => {
//                 getLeague(LeagueJS, summonerData.summonerId).then(leagueData => {
//                     let summonerName = summonerData.summonerName;
//                     let champion = '(' + championsMap.keys[summonerData.championId] + ')';
//                     let solo = 'RANKED SOLO: UNRANKED';
//                     let flex = 'RANKED FLEX: UNRANKED';
//                     let tft = 'RANKED TFT: UNRANKED';
//                     leagueData.forEach(queue => {
//                         if(queue.queueType.includes('SOLO')) solo = solo.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + 'LP');
//                         if(queue.queueType.includes('FLEX')) flex = flex.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + 'LP');
//                         if(queue.queueType.includes('TFT')) tft = tft.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + 'LP');
//                     });
//                     console.log(summonerName.padEnd(20, ' ') + champion.padEnd(20, ' ') + solo.padEnd(40, ' ') + flex.padEnd(40, ' ') + tft.padEnd(40, ' '));
//                 })
//             })
//         });
//     }).catch(err => {
//         console.log(err);
//         console.log('summoner not ingame');
//     })
// });