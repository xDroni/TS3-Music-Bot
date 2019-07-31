const { TeamSpeakClient } = require("node-ts");
const Playlist = require("./playlist");

/**
 * @param {TeamSpeakClient} client
 * @param {string} message
 * */
function sendChannelMessage(client, message) {
	client.send('sendtextmessage', {
		targetmode: 2,//CHANNEL
		target: 0,//current serveradmin channel
		msg: message
	}).catch(console.error);
}

module.exports = {
	/**
	 * @param {TeamSpeakClient} client
	 * @param {TextMessageNotificationData} message
	 * */
	handleMessage(client, message) {
		let {msg, invokername, invokerid} = message;
		msg = msg.toString().trim();
		console.log(`Message received from ${invokername}[${invokerid}]: ${msg}`);
		
		if( !msg.startsWith('!') )//not a command
			return;
		
		let [cmd, ...args] = msg.substring(1).split(' ');
		
		switch(cmd) {
			default:
				console.log('Unknown command', msg);
				break;
			case 'sr': {// song request
				if (args.length < 1) {
					sendChannelMessage(client, 'Należy podać link do utworu po spacji.'
						+ ' Przykładowo: !sr https://www.youtube.com/watch?v=nsBByTiKfyY');
					break;
				}
				
				// noinspection RegExpRedundantEscape
				let songUrl = args[0].replace(/^\[URL\]/i, '')
					.replace(/\[\/URL\]$/i, '');
				console.log('Song url:', songUrl);
				
				Playlist.add(songUrl);
				console.log('Added', songUrl, 'to the playlist');
				console.log('Playlist size:', Playlist.getSize());
			}   break;
		}
	}
};
