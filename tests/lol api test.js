// setting default platformId to be used if you don't specify it on the endpoint method
process.env.LEAGUE_API_PLATFORM_ID = 'eun1';

const LeagueJS = require('leaguejs');


const fs = require('fs');
const path = require('path');

const utils = require('../src/utils');

// put your RiotAPIKey in secrets folder
const APIKey = fs.readFileSync(path.join(utils.getSrcPath(), '..', 'secrets', 'RiotAPIKey' ), 'utf-8');
const leagueJs = new LeagueJS(APIKey);

let id;

leagueJs.Summoner
    .gettingByName('summoner')
    .then(data => {
        'use strict';
        // console.log(data);
        leagueJs.ChampionMastery.gettingBySummoner(data.id).then(data => {
            let championsMap;
            leagueJs.StaticData.gettingChampions().then(receivedMap => {
                championsMap = receivedMap.keys;
                // console.log(championsMap);
                // console.log(data);

                data.forEach(championData => {
                    console.log(championData.championPoints, championsMap[championData.championId]);
                });
            });

        }).catch(err => {
            console.log(err);
        })
    })
    .catch(err => {
        'use strict';
        console.log(err);
    });


