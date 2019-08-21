const { TeamSpeakClient } = require("node-ts");
const Entities = require('html-entities').AllHtmlEntities;
const path = require('path');
const {
	sendChannelMessage,
	championMastery,
	getSummonerId,
	getChampionsMap,
	getCurrentMatch,
	getLeague,
    getAccountId,
    getMatchById,
    getMatchListById,
	processLineByLine,
	getSrcPath,
	appendToFile,
	replaceInFile
} = require('./utils');
const Hangman = require('./hangman');
const LeagueJS = require('./league-api');
LeagueJS.updateRateLimiter({allowBursts: true});

const Playlist = require("./playlist");
const youtube = require('./youtube-api');

const entities = new Entities();

function addToPlaylist(title, invokerName, client) {
    youtube.searchVideos(title, 1).then((result) => {
        let title = entities.decode(result[0].title);
        Playlist.add(result[0].url, invokerName, title);
        console.log(invokerName, 'added', title, 'to the playlist');
        sendChannelMessage(client, invokerName +  ' added ' + title + ' to the playlist');
        console.log('Playlist size:', Playlist.getSize());
    }).catch(e => {
    	console.error(e);
    	sendChannelMessage(client, 'YoutubeApi error');
    });
}

module.exports = {
	/**
	 * @param {TeamSpeakClient} client
	 * @param {TextMessageNotificationData} message
	 * */
	handleChannelMessage(client, message) {
		let {msg, invokername, invokerid} = message;
		msg = msg.toString().trim();
		console.log(`Message received from ${invokername}[${invokerid}]: ${msg}`);

		if( !msg.startsWith('!') )//not a command
			return;

		let [cmd, ...args] = msg.substring(1).split(' ');
        switch(cmd.toLowerCase()) {
			default:
				sendChannelMessage(client, 'Unknown command: ' + msg);
				break;
			case 'sr': {// song request
                let song;
				if (args.length < 1) {
					sendChannelMessage(client, 'You need to provide the link to youtube or the title of the song.');
					break;
				}

				else if(args.length === 1) {
                    // noinspection RegExpRedundantEscape
                    song = args[0].replace(/^\[URL\]/i, '')
                        .replace(/\[\/URL\]$/i, '');
                    addToPlaylist(song, invokername, client);
                    break;
                }

				else {
                    addToPlaylist(args.join(' '), invokername, client);
                    break;
                }
			}
			case 'skip': {//skip current song
				let currentInfo;
				if(Playlist.getCurrent() !== undefined) {
					currentInfo = Playlist.getCurrent().title + ' requested by ' + Playlist.getCurrent().clientName;
				}
				if(Playlist.skipCurrent() === true) {
					sendChannelMessage(client, 'Skipping ' + currentInfo);
				}
				else {
					sendChannelMessage(client, 'Queue is empty')
				}
				break;
			}
			case 'skiplast': {//remove the most recent added song from queue
				if(Playlist.skipLast() === true ) {
					sendChannelMessage(client, 'Removed the most recent added song');
				}
				else {
					sendChannelMessage(client, 'Queue is empty');
				}
				break;
			}
            case 'current': {
                sendChannelMessage(client, Playlist.getCurrent().title + ' requested by ' + Playlist.getCurrent().clientName);
                break;
            }
			case 'size': {
				sendChannelMessage(client, Playlist.getSize() + ' songs in the queue');
				break;
			}
			
	        case 'wisielec':
	        case 'hangman':
	        	Hangman.startGame(client, invokerid);
	        	break;

			case 'maestry':
			case 'mastery':
				if(args.length < 1) {
					sendChannelMessage(client, 'Summoner name missing');
					break;
				}
				else {
					championMastery(LeagueJS, args.join(' ')).then(data => {
						sendChannelMessage(client,
											'\n5 best champions of ' +
											args.join(' ') + '\n' +
											data.join('\n'));
					});
					break;
				}
			case 'live':
				getSummonerId(LeagueJS, args.join(' ')).then(summonerId => {
					getCurrentMatch(LeagueJS, summonerId).then(activeMatch => {
						sendChannelMessage(client, activeMatch.gameMode + ' ' + activeMatch.gameType);
                        let team1 = [];
                        let team2 = [];
						getChampionsMap(LeagueJS).then(championsMap => {
							activeMatch.participants.forEach(summonerData => {
								getLeague(LeagueJS, summonerData.summonerId).then(leagueData => {
									let summonerName = summonerData.summonerName;
									let champion = '(' + championsMap.keys[summonerData.championId] + ')';
									let solo = 'SOLO: UNRANKED';
									let flex = 'FLEX: UNRANKED';
									let tft = 'TFT: UNRANKED';
									leagueData.forEach(queue => {
										if(queue.queueType.includes('SOLO')) solo = solo.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + ' LP' + ' (WR ' + Math.round((queue.wins / (queue.wins + queue.losses)) * 100) + '% ' + (queue.wins + queue.losses) + ' matches)');
										if(queue.queueType.includes('FLEX')) flex = flex.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + ' LP' + ' (WR ' + Math.round((queue.wins / (queue.wins + queue.losses)) * 100) + '% ' + (queue.wins + queue.losses) + ' matches)');
										if(queue.queueType.includes('TFT')) tft = tft.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + ' LP' + ' (WR ' + Math.round((queue.wins / (queue.wins + queue.losses)) * 100) + '% ' + (queue.wins + queue.losses) + ' matches)');
									});

                                    if(summonerData.teamId === 100) team1.push(summonerName.padEnd(20, ' ') + champion.padEnd(15, ' ') + solo.padEnd(50, ' ') + flex.padEnd(50, ' ') + tft.padEnd(50, ' '));
                                    else if(summonerData.teamId === 200) team2.push(summonerName.padEnd(20, ' ') + champion.padEnd(15, ' ') + solo.padEnd(50, ' ') + flex.padEnd(50, ' ') + tft.padEnd(50, ' '));
                                    if(team1.length + team2.length === activeMatch.participants.length)  {
										sendChannelMessage(client, '\n' + team1.join('\n') + '\n' + ''.padStart(185, '-') + '\n' + team2.join('\n'));
										console.log(team1.join('\n') + '\n\n' + team2.join('\n'));
									}
								})
							})
						});
					}).catch(err => {
						sendChannelMessage(client, 'Error: ' + JSON.parse(err.error).status.message + ' - summoner is not in game');
						console.error('Error: ' + JSON.parse(err.error).status.message + ' - summoner is not in game');
					})
				}).catch(err => {
					try {
						let msg = JSON.parse(err.error).status.message;
						sendChannelMessage(client, 'Error: ' + msg);
						console.error('Error: ' + msg);
					} catch(e) {
						sendChannelMessage(client, err);
						console.error(err);
					}

				});
				break;
            case 'cs':
                (async () => {
					let summonerNameToCompare, csToCompare;
					let csComparePath = path.join(getSrcPath(), 'leagueFiles', 'cs-compare');
					const array = await processLineByLine(csComparePath).catch(err => console.log(err));
					if(array !== undefined && array.length >= 1) {
						if(array.length === 1) summonerNameToCompare = array[0];
						else if(array.length === 2) {
							summonerNameToCompare = array[0];
							csToCompare = array[1];
						}
					}
                    const summonerNameFromArgs = args.join(' ');
                    let summonerNameExact;
                    let accountId = await getAccountId(LeagueJS, summonerNameFromArgs).catch(err => sendChannelMessage(client, err));
                    let matchList = await getMatchListById(LeagueJS, accountId).catch(err => sendChannelMessage(client, err));

                    let sum = 0, count = 0;
                    for(let match of matchList.matches) {
                        let res = await getMatchById(LeagueJS, match.gameId).catch(err => sendChannelMessage(client, err));
                        for(let index=0; index<res.participants.length; index++) {
                            if( match.role.includes('SUPPORT') )
                                continue;
                            if( res.participantIdentities[index].player.summonerName.toLowerCase() === summonerNameFromArgs.toLowerCase() ) {
                                if(summonerNameExact === undefined) summonerNameExact = res.participantIdentities[index].player.summonerName;
                                sum += Math.round(((res.participants[index].stats.totalMinionsKilled +
                                    res.participants[index].stats.neutralMinionsKilled) / (res.gameDuration / 60)) * 100) / 100;
                                count++;
                                break;
                            }
                        }
                    }
					let avgCs = Math.round((sum / count) * 100) / 100;
					if(summonerNameToCompare === undefined && csToCompare === undefined) {
						sendChannelMessage(client,`Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}.`);
					}
                    else if(summonerNameToCompare !== undefined && csToCompare === undefined) {
                    	if(summonerNameExact === summonerNameToCompare) {
                    		appendToFile(csComparePath, avgCs);
							sendChannelMessage(client,`Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}. Updated`);
						}
                    	else {
							sendChannelMessage(client,`Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}.`);
						}
					}
                    else if(summonerNameToCompare !== undefined && csToCompare !== undefined) {
						if(summonerNameExact === summonerNameToCompare) {
							await replaceInFile(csComparePath, csToCompare, avgCs).catch(err => console.log(err));
							sendChannelMessage(client,`Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}. Updated`);
						}
						else {
							let diff = Math.round(Math.abs(avgCs - csToCompare) / ((Number(avgCs) + Number(csToCompare)) / 2) * 1000) / 10;
							sendChannelMessage(client,`Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}, it's ${diff}% ${avgCs > csToCompare ? 'better' : 'worse'} than Droni! Droni has avg ${csToCompare}cs/min`);
						}
					}
                })();
                break;
		}
	},
	
	/**
	 * @param {TeamSpeakClient} client
	 * @param {TextMessageNotificationData} message
	 * */
	handlePrivateMessage(client, message) {
		let {msg, invokername, invokerid} = message;
		msg = msg.toString().trim();
		console.log(`Private message received from ${invokername}[${invokerid}]: ${msg}`);
		
		let [cmd/*, ...args*/] = msg.substring(1).split(' ');
		
		switch(cmd.toLowerCase()) {
			default:
				Hangman.onPrivateMessage(invokerid, msg);
				break;
			case 'wisielec':
	        case 'hangman':
	        	Hangman.startGame(client, invokerid);
	        	break;
		}
	}
};
