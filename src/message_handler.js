const { TeamSpeakClient } = require("node-ts");

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
		console.log(cmd, args);
		
		switch(cmd) {
			default:
				console.log('Unknown command');
				break;
			case 'test':
				console.log('arguments:', args);
				break;
		}
	}
};