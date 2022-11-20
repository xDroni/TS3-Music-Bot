const {TeamSpeakClient} = require("node-ts");
const path = require('path');
const ytpl = require('ytpl');
const ytdl = require('youtube-dl-exec');
const Queue = require("./queue");
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
  writeFile,
  replaceInFile,
  setProperty,
  getProperty,
  isYouTubeLink,
  isLink
} = require('./utils');
const propertiesPath = path.join(getSrcPath(), 'leagueFiles', 'properties');
const leagueFilesPath = path.join(getSrcPath(), 'leagueFiles');
const Hangman = require('./hangman');
const LeagueJS = require('leaguejs');
let leagueJS = null;
const config = require('./config.json');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

// undefined if no api key is provided
const youtube = require('./youtube-api');

if (!config.RiotAPIKey) {
  console.error('RiotAPIKey is missing.');
} else {
  leagueJS = new LeagueJS(config.RiotAPIKey, {
    PLATFORM_ID: 'eun1'
  });
  leagueJS.updateRateLimiter({allowBursts: true});
}

function addToQueue(song, invokerName, client) {
  if (isLink(song)) {
    // song is the url so play directly from url
    if (isYouTubeLink(song) && youtube) {
      youtube.getVideo(song).then((result) => {
        let title = entities.decode(result.title);
        Queue.addSong(`https://youtu.be/${result.id}`, invokerName, title, client);
        console.log(invokerName, 'added', title, 'to the queue');
        sendChannelMessage(client, invokerName + ' added ' + title + ' to the queue');
      }).catch(e => {
        console.error(e);
        sendChannelMessage(client, e.message);
      });
    } else {
      ytdl(song, {
        dumpSingleJson: true,
        noPlaylist: true,
        abortOnError: true,
        playlistEnd: 1,
        youtubeSkipDashManifest: true,
      }).then(output => {
        const title = output.title;
        Queue.addSong(song, invokerName, title, client);
        console.log(invokerName, 'added', title, 'to the queue');
        sendChannelMessage(client, invokerName + ' added ' + title + ' to the queue');
      }).catch(e => {
        console.error(e);
        sendChannelMessage(client, 'error');
      });
    }
  } else if (youtube) {
    // song is the title so search on YouTube
    youtube.searchVideos(song, 1).then((result) => {
      let title = entities.decode(result[0].title);
      Queue.addSong(result[0].url, invokerName, title, client);
      console.log(invokerName, 'added', title, 'to the queue');
      sendChannelMessage(client, invokerName + ' added ' + title + ' to the queue');
    }).catch(e => {
      console.error(e);
      sendChannelMessage(client, e.message);
    });
  } else {
    // YouTube is undefined (api key is not provided)
    console.error("The search for the song feature is only available with provided Google API Key, please provide one and restart the bot or add the song using url");
    sendChannelMessage(client, "The search for the song feature is only available with provided Google API Key, please provide one and restart the bot or add the song using url");
  }
}

async function addPlaylist(playlist, invokerName, client, mix = false) {
  try {
    await ytpl(playlist, {limit: Infinity}).then(playlist => {
      const p = playlist.items.map(song => ({
        url: song.shortUrl,
        title: song.title,
      }));

      Queue.addPlaylist(p, invokerName, mix, client);
      sendChannelMessage(client, `${invokerName} added '${playlist.title}' to the queue (${playlist.estimatedItemCount} songs, last ${playlist.lastUpdated.toLowerCase()})`);
    });
  } catch (e) {
    console.error(e);
    sendChannelMessage(client, 'Error, check the link');
  }
}

module.exports = {
  /**
   * @param {TeamSpeakClient} client
   * @param {TextMessageNotificationData} message
   * */ async handleChannelMessage(client, message) {
    let {msg, invokername, invokerid} = message;
    msg = msg.toString().trim();
    console.log(`Message received from ${invokername}[${invokerid}]: ${msg}`);

    if (!msg.startsWith('!'))//not a command
      return;

    let [cmd, ...args] = msg.substring(1).split(' ');
    switch (cmd.toLowerCase()) {
      default:
        sendChannelMessage(client, 'Unknown command: ' + msg);
        break;
      case 'sr': {// song request
        let song;
        if (args.length < 1) {
          sendChannelMessage(client, 'You need to provide the link to youtube or the title of the song.');
          break;
        } else if (args.length === 1) {
          // noinspection RegExpRedundantEscape
          song = args[0].replace(/^\[URL\]/i, '')
              .replace(/\[\/URL\]$/i, '');
          addToQueue(song, invokername, client);
          break;
        } else {
          addToQueue(args.join(' '), invokername, client);
          break;
        }
      }
      case 'skip': {//skip current song
        let currentInfo;
        if (Queue.getCurrent()) {
          currentInfo = Queue.getCurrent().title + ' requested by ' + Queue.getCurrent().clientName;
        }
        if (Queue.skipCurrent() === true) {
          sendChannelMessage(client, 'Skipping ' + currentInfo);
        } else {
          sendChannelMessage(client, 'Queue is empty');
        }
        break;
      }
      case 'skiplast': {//remove the most recent added song from queue
        if (Queue.skipLast() === true) {
          sendChannelMessage(client, 'Removed the most recent added song');
        } else {
          sendChannelMessage(client, 'Queue is empty');
        }
        break;
      }
      case 'skipall': {
        if (Queue.skipAll() === true) {
          sendChannelMessage(client, 'Skipping all');
        } else {
          sendChannelMessage(client, 'Queue is empty');
        }
        break;
      }
      case 'current': {
        if (!Queue.getCurrent()) {
          sendChannelMessage(client, 'Nothing is playing right now');
        } else {
          sendChannelMessage(client, Queue.getCurrent().title + ' requested by ' + Queue.getCurrent().clientName);
        }
        break;
      }
      case 'previous': {
        if (!Queue.getPrevious()) {
          sendChannelMessage(client, 'Cannot find previous song');
        } else {
          sendChannelMessage(client, Queue.getPrevious().title + ' requested by ' + Queue.getPrevious().clientName);
        }
        break;
      }
      case 'size': {
        const {queueSize, playlistSize} = Queue.getSize();
        sendChannelMessage(client, queueSize + ' songs in the queue, ' + playlistSize + ' songs in the playlist');
        break;
      }
      case 'playlist':
      case 'p': {
        let playlist;
        if (args.length < 1) {
          sendChannelMessage(client, 'You need to provide the link to youtube playlist');
        } else if (args.length === 1) {
          // noinspection RegExpRedundantEscape
          playlist = args[0].replace(/^\[URL\]/i, '')
              .replace(/\[\/URL\]$/i, '');
          await addPlaylist(playlist, invokername, client);
        } else if (args.length === 2) {
          // noinspection RegExpRedundantEscape
          playlist = args[1].replace(/^\[URL\]/i, '')
              .replace(/\[\/URL\]$/i, '');
          if (args[0] === 'm' || args[0] === 'mix') {
            await addPlaylist(playlist, invokername, client, true);
          } else {
            sendChannelMessage(client, `Unknown parameter ${args[1]}`);
            await addPlaylist(playlist, invokername, client);
          }
        }
        break;
      }

      case 'mix':
      case 'm': {
        const {playlistSize} = Queue.getSize();
        if (playlistSize > 2) {
          Queue.mix();
          sendChannelMessage(client, 'Mixing');
          break;
        }
        sendChannelMessage(client, 'Playlist empty?');
        break;
      }

      case 'list':
      case 'l': {
        const list = Queue.getList();
        if (list.length) {
          let message = '\n';
          for (let i = 0; i < list.length && i < 5; i++) {
            message += `${i + 1}. ${list[i].title}, requested by ${list[i].clientName}\n`;
          }
          sendChannelMessage(client, message);
          break;
        }
        sendChannelMessage(client, 'List is empty');
        break;
      }

      case 'wisielec':
      case 'hangman':
        Hangman.startGame(client, invokerid);
        break;
      case 'maestry':
      case 'mastery':
        if (args.length < 1) {
          sendChannelMessage(client, 'Summoner name missing');
          break;
        } else {
          championMastery(leagueJS, args.join(' ')).then(data => {
            sendChannelMessage(client,
                '\n5 best champions of ' +
                args.join(' ') + '\n' +
                data.join('\n'));
          });
          break;
        }
      case 'live':
        if (!leagueJS) {
          const textMessage = 'RiotAPIKey is missing or invalid. Check config file.';
          console.error(textMessage);
          sendChannelMessage(client, textMessage);
        } else {
          await (async () => {
            try {
              let summonerId = await getSummonerId(leagueJS, args.join(' '));
              let activeMatch = await getCurrentMatch(leagueJS, summonerId);
              try {
                sendChannelMessage(client, activeMatch.gameMode + ' ' + activeMatch.gameType);
                let team1 = [];
                let team2 = [];

                let championsMap = await getChampionsMap(leagueJS);

                for (const summonerData of activeMatch.participants) {
                  let leagueData = await getLeague(leagueJS, summonerData.summonerId);

                  let summonerName = summonerData.summonerName;
                  let champion = '(' + championsMap.keys[summonerData.championId] + ')';
                  let solo = 'SOLO: UNRANKED';
                  let flex = 'FLEX: UNRANKED';
                  let tft = 'TFT: UNRANKED';
                  leagueData.forEach(queue => {
                    if (queue.queueType.includes('SOLO')) solo = solo.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + ' LP' + ' (WR ' + Math.round((queue.wins / (queue.wins + queue.losses)) * 100) + '% ' + (queue.wins + queue.losses) + ' matches)');
                    if (queue.queueType.includes('FLEX')) flex = flex.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + ' LP' + ' (WR ' + Math.round((queue.wins / (queue.wins + queue.losses)) * 100) + '% ' + (queue.wins + queue.losses) + ' matches)');
                    if (queue.queueType.includes('TFT')) tft = tft.replace('UNRANKED', queue.tier + ' ' + queue.rank + ' ' + queue.leaguePoints + ' LP' + ' (WR ' + Math.round((queue.wins / (queue.wins + queue.losses)) * 100) + '% ' + (queue.wins + queue.losses) + ' matches)');
                  });

                  if (summonerData.teamId === 100) team1.push(summonerName.padEnd(20, ' ') + champion.padEnd(15, ' ') + solo.padEnd(50, ' ') + flex.padEnd(50, ' ') + tft.padEnd(50, ' '));
                  else if (summonerData.teamId === 200) team2.push(summonerName.padEnd(20, ' ') + champion.padEnd(15, ' ') + solo.padEnd(50, ' ') + flex.padEnd(50, ' ') + tft.padEnd(50, ' '));
                  if (team1.length + team2.length === activeMatch.participants.length) {
                    sendChannelMessage(client, '\n' + team1.join('\n') + '\n' + ''.padStart(185, '-') + '\n' + team2.join('\n'));
                    console.log(team1.join('\n') + '\n\n' + team2.join('\n'));
                  }

                }
              } catch (err) {
                sendChannelMessage(client, 'Error: ' + JSON.parse(err.error).status.message + ' - summoner is not in game');
                console.error('Error: ' + JSON.parse(err.error).status.message + ' - summoner is not in game');
              }
            } catch (err) {
              try {
                let msg = JSON.parse(err.error).status.message;
                sendChannelMessage(client, 'Error: ' + msg);
                console.error('Error: ' + msg);
              } catch (e) {
                sendChannelMessage(client, err);
                console.error(err);
              }
            }
          })();
        }
        break;
      case 'cs':
        if (!leagueJS) {
          const textMessage = 'RiotAPIKey is missing or invalid. Check config file.';
          console.error(textMessage);
          sendChannelMessage(client, textMessage);
        } else {
          await (async () => {
            let summonerNameToCompare, csToCompare;
            let csComparePath = path.join(getSrcPath(), 'leagueFiles', 'cs-compare');
            try {
              const array = await processLineByLine(csComparePath);
              if (array !== undefined && array.length >= 1) {
                if (array.length === 1) summonerNameToCompare = array[0];
                else if (array.length === 2) {
                  summonerNameToCompare = array[0];
                  csToCompare = array[1];
                }
              }
            } catch (e) {
              console.error(e);
            }
            const summonerNameFromArgs = args.join(' ');
            let summonerNameExact;
            let accountId = await getAccountId(leagueJS, summonerNameFromArgs).catch(err => sendChannelMessage(client, err));
            let matchList = await getMatchListById(leagueJS, accountId).catch(err => sendChannelMessage(client, err));

            let sum = 0, count = 0;
            for (let match of matchList.matches) {
              let res = await getMatchById(leagueJS, match.gameId).catch(err => sendChannelMessage(client, err));
              for (let index = 0; index < res.participants.length; index++) {
                if (match.role.includes('SUPPORT'))
                  continue;
                if (res.participantIdentities[index].player.summonerName.toLowerCase() === summonerNameFromArgs.toLowerCase()) {
                  if (summonerNameExact === undefined) summonerNameExact = res.participantIdentities[index].player.summonerName;
                  sum += Math.round(((res.participants[index].stats.totalMinionsKilled +
                      res.participants[index].stats.neutralMinionsKilled) / (res.gameDuration / 60)) * 100) / 100;
                  count++;
                  break;
                }
              }
            }
            let avgCs = Math.round((sum / count) * 100) / 100;
            if (summonerNameToCompare === undefined && csToCompare === undefined) {
              sendChannelMessage(client, `Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}.`);
            } else if (summonerNameToCompare !== undefined && csToCompare === undefined) {
              if (summonerNameExact.toLowerCase() === summonerNameToCompare.toLowerCase()) {
                await replaceInFile(csComparePath, summonerNameToCompare, summonerNameExact).catch(err => {
                  console.log(err);
                  sendChannelMessage(client, err);
                });
                appendToFile(csComparePath, avgCs);
                sendChannelMessage(client, `Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}. Updated`);
              } else {
                sendChannelMessage(client, `Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}.`);
              }
            } else if (summonerNameToCompare !== undefined && csToCompare !== undefined) {
              if (summonerNameExact.toLowerCase() === summonerNameToCompare.toLowerCase()) {
                await replaceInFile(csComparePath, csToCompare, avgCs).catch(err => {
                  console.log(err);
                  sendChannelMessage(client, err);
                });
                sendChannelMessage(client, `Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}. Updated`);
              } else {
                let diff = Math.round(Math.abs(avgCs - csToCompare) / ((Number(avgCs) + Number(csToCompare)) / 2) * 1000) / 10;
                sendChannelMessage(client, `Average ${avgCs}cs/min in last ${count} not support games - ${summonerNameExact}, it's ${diff}% ${avgCs > csToCompare ? 'better' : 'worse'} than ${summonerNameToCompare}! ${summonerNameToCompare} has average ${csToCompare}cs/min`);
              }
            }
          })();
        }
        break;
      case 'properties':
        processLineByLine(propertiesPath).then(res => {
          sendChannelMessage(client, '\n' + res.join('\n'));
          sendChannelMessage(client, 'To change property, use this syntax: !propertiesSet property value');
          sendChannelMessage(client, 'Example: !propertiesSet region eune');
        });
        break;
      case 'exit':
        sendChannelMessage(client, 'Music bot turned off.');
        process.exit();
        break;
      case 'propertiesset':
        if (args.length < 2) {
          sendChannelMessage(client, `Invalid number of arguments, expected 2 or more, received ${args.length}`);
        } else {
          if (getProperty(propertiesPath, args[0]) !== null) {
            setProperty(propertiesPath, args[0], args.slice(1, args.length).join(' ')).then(res => {
              if (args[0].includes('csCompare')) {
                writeFile(path.join(leagueFilesPath, 'cs-compare'), args.slice(1, args.length).join(' '));
              }
              console.log(`Changed property. Properties are now:\n${res}`);
              sendChannelMessage(client, `Changed property. Properties are now:\n${res}`);
            });
          } else {
            sendChannelMessage(client, `Error: '${args[0]}' property cannot be found in the properties file.`);
            console.error(`Error: '${args[0]}' property cannot be found in the properties file.`);
          }
        }
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

    switch (cmd.toLowerCase()) {
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
