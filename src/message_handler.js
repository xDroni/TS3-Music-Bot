const { TeamSpeakClient } = require('node-ts');
const ytpl = require('ytpl');
const ytext = require('youtube-ext');
const { sendChannelMessage, isYouTubeLink, makeRequest } = require('./utils');
const Hangman = require('./hangman');

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const Queue = require('./queue');
const YouTubeAPI = require('./youtube-api');

const config = require('./config.json');
let isYouTubeAPIAvailable = null;

async function isYouTubeAPIAvailableFn() {
  if (!Boolean(config?.GoogleAPIKey)) {
    return false;
  }

  let apiKeyTestResult;
  try {
    apiKeyTestResult = JSON.parse(await makeRequest(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=YouTube+Data+API&type=video&key=${config.GoogleAPIKey}`));
  } catch (e) {
    console.error(e);
  }

  const isAPIError = apiKeyTestResult && apiKeyTestResult.hasOwnProperty('error');

  if (isAPIError) {
    console.dir({ APIError: apiKeyTestResult }, { depth: 5 });
  }

  return (isYouTubeAPIAvailable = apiKeyTestResult && !isAPIError);
}

function addToQueue(titleOrUrl, userName, client) {
  if (isYouTubeLink(titleOrUrl)) {
    if (isYouTubeAPIAvailable) {
      YouTubeAPI.getVideo(titleOrUrl)
        .then((result) => {
          let title = entities.decode(result.title);
          Queue.addSong(`https://youtu.be/${result.id}`, userName, title, client);
          console.log(userName, 'added', title, 'to the queue');
          sendChannelMessage(client, userName + ' added ' + title + ' to the queue');
        })
        .catch((e) => {
          console.error(e);
          sendChannelMessage(client, 'YouTubeApi error, check console for more info. Restart the bot to switch to non-API mode.');
        });
    } else {
      ytext
        .videoInfo(titleOrUrl, {
          requestOptions: {
            headers: {
              Cookie: config?.cookiesString
            }
          }
        })
        .then(({ title, id }) => {
          Queue.addSong(`https://youtu.be/${id}`, userName, title, client);
          console.log(userName, 'added', title, 'to the queue');
          sendChannelMessage(client, userName + ' added ' + title + ' to the queue');
        })
        .catch((e) => {
          console.error(e);
          sendChannelMessage(client, 'Error occurred, check console for more info.');
        });
    }
  } else {
    if (isYouTubeAPIAvailable) {
      YouTubeAPI.searchVideos(titleOrUrl, 1)
        .then((result) => {
          let title = entities.decode(result[0].title);
          Queue.addSong(result[0].url, userName, title, client);
          console.log(userName, 'added', title, 'to the queue');
          sendChannelMessage(client, userName + ' added ' + title + ' to the queue');
        })
        .catch((e) => {
          console.error(e);
          sendChannelMessage(client, 'YouTubeApi error, check console for more info. Restart the bot to switch to non-API mode.');
        });
    } else {
      ytext
        .search(titleOrUrl, {
          filterType: 'video',
          requestOptions: {
            headers: {
              Cookie: config?.cookiesString
            }
          }
        })
        .then(({ videos }) => {
          const { title, id } = videos[0];
          Queue.addSong(`https://youtu.be/${id}`, userName, title, client);
          console.log(userName, 'added', title, 'to the queue');
          sendChannelMessage(client, userName + ' added ' + title + ' to the queue');
        })
        .catch((e) => {
          console.error(e);
          sendChannelMessage(client, 'Error occurred, check console for more info.');
        });
    }
  }
}

async function addPlaylist(playlist, invokerName, client, mix = false) {
  try {
    await ytpl(playlist, { limit: Infinity }).then((playlist) => {
      const p = playlist.items.map((song) => ({
        url: song.shortUrl,
        title: song.title
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
  isYouTubeAPIAvailableFn,

  /**
   * @param {TeamSpeakClient} client
   * @param {TextMessageNotificationData} message
   * */ async handleChannelMessage(client, message) {
    let { msg, invokername, invokerid } = message;
    msg = msg.toString().trim();
    console.log(`Message received from ${invokername}[${invokerid}]: ${msg}`);

    if (!msg.startsWith('!'))
      //not a command
      return;

    let [cmd, ...args] = msg.substring(1).split(' ');
    switch (cmd.toLowerCase()) {
      default:
        sendChannelMessage(client, 'Unknown command: ' + msg);
        break;
      case 'play':
      case 's':
      case 'sr': {
        // song request
        let song;
        if (args.length < 1) {
          sendChannelMessage(client, 'You need to provide the link to youtube or the title of the song.');
          break;
        } else if (args.length === 1) {
          song = args[0].replace(/^\[URL]/i, '').replace(/\[\/URL]$/i, '');
          addToQueue(song, invokername, client);
          break;
        } else {
          addToQueue(args.join(' '), invokername, client);
          break;
        }
      }
      case 'skip': {
        //skip current song
        let currentInfo;
        if (Queue.getCurrent()) {
          currentInfo = Queue.getCurrent().title + ' requested by ' + Queue.getCurrent().userName;
        }
        if (Queue.skipCurrent() === true) {
          sendChannelMessage(client, 'Skipping ' + currentInfo);
        } else {
          sendChannelMessage(client, 'Queue is empty');
        }
        break;
      }
      case 'sl':
      case 'skiplast': {
        //remove the most recent added song from the queue
        if (Queue.skipLast() === true) {
          sendChannelMessage(client, 'Removed the most recent added song');
        } else {
          sendChannelMessage(client, 'Queue is empty');
        }
        break;
      }
      case 'sa':
      case 'skipall': {
        if (Queue.skipAll() === true) {
          sendChannelMessage(client, 'Skipping all');
        } else {
          sendChannelMessage(client, 'Queue is empty');
        }
        break;
      }
      case 'c':
      case 'current': {
        if (!Queue.getCurrent()) {
          sendChannelMessage(client, 'Nothing is playing right now');
        } else {
          sendChannelMessage(client, Queue.getCurrent().title + ' requested by ' + Queue.getCurrent().userName);
        }
        break;
      }
      case 'last':
      case 'previous': {
        const previous = Queue.getPrevious();
        if (!previous) {
          sendChannelMessage(client, 'Cannot find previous song');
        } else {
          const { title, userName } = previous;
          addToQueue(title, userName, client);
          sendChannelMessage(client, title + ' requested by ' + userName);
        }
        break;
      }
      case 'length':
      case 'size': {
        const { queueSize, playlistSize } = Queue.getSize();
        sendChannelMessage(client, queueSize + ' songs in the queue, ' + playlistSize + ' songs in the playlist');
        break;
      }
      case 'playlist':
      case 'p': {
        let playlist;
        if (args.length < 1) {
          sendChannelMessage(client, 'You need to provide the link to youtube playlist.');
        } else if (args.length === 1) {
          playlist = args[0].replace(/^\[URL]/i, '').replace(/\[\/URL]$/i, '');
          await addPlaylist(playlist, invokername, client);
        } else if (args.length === 2) {
          // needed as links are surrounded with [URL] and [/URL]
          playlist = args[1].replace(/^\[URL]/i, '').replace(/\[\/URL]$/i, '');
          if (['m', 'mix', 'shuffle'].includes(args[0])) {
            await addPlaylist(playlist, invokername, client, true);
          } else {
            sendChannelMessage(client, `Unknown parameter ${args[0]}`);
            await addPlaylist(playlist, invokername, client);
          }
        }
        break;
      }

      case 'shuffle':
      case 'mix':
      case 'm': {
        const { playlistSize } = Queue.getSize();
        if (playlistSize > 2) {
          Queue.shuffle();
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
            message += `${i + 1}. ${list[i].title}, requested by ${list[i].userName}\n`;
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
      case 'properties': {
        // todo
        break;
      }
      case 'propertiesSet':
      case 'propertiesset':
        break;
      // todo
      // if (args.length < 2) {
      //     sendChannelMessage(client, `Invalid number of arguments, expected 2 or more, received ${args.length}`);
      // } else {
      //     if (getProperty(propertiesPath, args[0]) !== null) {
      //         setProperty(propertiesPath, args[0], args.slice(1, args.length).join(' ')).then(res => {
      //             //
      //         });
      //     } else {
      //         sendChannelMessage(client, `Error: '${args[0]}' property cannot be found in the properties file.`);
      //         console.error(`Error: '${args[0]}' property cannot be found in the properties file.`);
      //     }
      // }
      case 'exit':
        sendChannelMessage(client, 'Music bot turned off.');
        process.exit();
    }
  },

  /**
   * @param {TeamSpeakClient} client
   * @param {TextMessageNotificationData} message
   * */
  handlePrivateMessage(client, message) {
    let { msg, invokername, invokerid } = message;
    msg = msg.toString().trim();
    console.log(`Private message received from ${invokername}[${invokerid}]: ${msg}`);

    let [cmd /*, ...args*/] = msg.substring(1).split(' ');

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
