const { TeamSpeakClient } = require("node-ts");
const { getArgument } = require("./utils.js");
const { handleMessage } = require("./message_handler.js");

/**
 * @param {TeamSpeakClient} client
 * @param {number} channel_id
 * */
async function moveAdminTo(client, channel_id) {
	const clientlist = await client.send("clientlist");
	let serveradmin = clientlist.response.find((obj) => {
		return obj.client_type === 1 && obj.client_nickname.match(/^serveradmin/i);
	});
	
	if (serveradmin) {
		if (serveradmin.cid !== channel_id)//if serveradmin is not already in target channel
			await client.send('clientmove', {clid: serveradmin.clid, cid: channel_id});
	}
	else
		console.error('Music bot or serveradmin has not been found');
}

async function main(host, login, password) {
    //console.log('host:', host);
    //console.log('login:', login);
    //console.log('password:', password);

    const client = new TeamSpeakClient(host);
    
    try {
        await client.connect();
        await client.send("use", {sid: 1});

        await client.send("login", {
            client_login_name: login,
            client_login_password: password
        });
        
        await client.subscribePrivateTextEvents();

        await client.send("servernotifyregister", {
            event: "textchannel",
            channelId: 2
        });

        const clientlist = await client.send("clientlist");

        let musicBotInfo = clientlist.response.find((obj) => obj.client_nickname === "DJ Jaracz");
        if(musicBotInfo)
            await moveAdminTo(client, musicBotInfo.cid);
        else
        	console.error('DJ Jaracz not found');
        
        //listening for messages
        await client.on("textmessage", data => {
            if(data[0])
                handleMessage(client, data[0]);
        });
    } catch(err) {
        console.error("An error occurred: ");
        console.error(err);
    }
}

main(
    getArgument('host'),
    getArgument('login'),
    getArgument('password')
).catch(console.error);
