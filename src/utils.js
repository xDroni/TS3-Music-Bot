const prompt = require('prompt-sync')();
const { TeamSpeakClient } = require('node-ts');
const https = require('https');

/** @param {string} str */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isYouTubeLink(url) {
  const regexp = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
  return regexp.test(url);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function makeRequest(url) {
  return new Promise((resolve) => {
    let data = '';
    https.get(url, (res) => {
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });
  });
}

module.exports = {
  escapeRegExp,
  isYouTubeLink,
  shuffleArray,
  makeRequest,

  /** @param {string} name */
  getArgument(name) {
    for (let arg of process.argv) {
      let regexp = new RegExp(`^${escapeRegExp(name)}`);
      if (arg.match(regexp)) return arg.replace(regexp, '').substring(1);
    }

    try {
      //ask user to type password in console
      return prompt(name + ': ') || '';
    } catch (e) {
      console.error('Argument ' + name + ' not found. Closing program.');
      process.exit();
    }
  },

  /**
   * @param {TeamSpeakClient} client
   * @param {string} message
   * */
  sendChannelMessage(client, message) {
    client
      .send('sendtextmessage', {
        targetmode: 2, //CHANNEL
        target: 0, //current serveradmin channel
        msg: message
      })
      .catch(console.error);
  },

  /**
   * @param {TeamSpeakClient} client
   * @param {number} target_id
   * @param {string} message
   * */
  sendPrivateMessage(client, target_id, message) {
    client
      .send('sendtextmessage', {
        targetmode: 1, //CLIENT
        target: target_id, //current serveradmin channel
        msg: message
      })
      .catch(console.error);
  }
};
