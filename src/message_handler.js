const { TeamSpeakClient } = require("node-ts");

module.exports = {
	/**
	 * @param {TeamSpeakClient} client
	 * @param {TextMessageNotificationData} message
	 * */
	handleMessage(client, message, playlist) {
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
			case 'sr': // song request
				let songName = args.join(' ');
				console.log('Song name:', songName);
				console.log('arguments:', args);
				playlist.add(songName);
				console.log('Added', songName, 'to the playlist');
				console.log('Playlist size:', playlist.getSize());
				break;
		}
	}
};
