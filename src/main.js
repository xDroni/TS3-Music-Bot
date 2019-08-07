const { TeamSpeakClient } = require("node-ts");
const { getArgument, escapeRegExp } = require("./utils.js");
const { handleMessage } = require("./message_handler.js");

const NICKNAME = 'MusicBot';

/**
 * @param {TeamSpeakClient} client
 * @param {number} channel_id
 * */
async function moveAdminTo(client, channel_id) {
    const clientList = await client.send("clientlist");
    const channelList = await client.send('channellist');
	let serverAdmin = clientList.response.find((obj) => {
		return obj.client_type === 1 && obj.client_nickname.match(
			new RegExp(`^${escapeRegExp(NICKNAME)}`, 'i'));
	});

	if (serverAdmin) {
		if (serverAdmin.cid !== channel_id) {//if serverAdmin is not already in target channel
			await client.send('clientmove', {clid: serverAdmin.clid, cid: channel_id});
			let channel_name = channelList.response.find((obj) => obj.cid === channel_id).channel_name;
			console.log('Admin moved to:', channel_name, 'cid:', channel_id);
		}
	}
	else
		console.error('Music bot or serverAdmin has not been found');

    await client.send('sendtextmessage', {
        targetmode: 2, //send message to the current channel
        target: channel_id,
        msg: "DJ Jaracz joined the party!"
    });
}

async function main(host, login, password) {
    //console.log('host:', host);
    //console.log('login:', login);
    //console.log('password:', password);

    const client = new TeamSpeakClient(host);

    try {
    	client.on('error', e => console.error(e));

        await client.connect();
        await client.send("use", {sid: 1});

        await client.send("login", {
            client_login_name: login,
            client_login_password: password
        });
        await client.send("clientupdate", {client_nickname: NICKNAME});
        
        // await client.subscribePrivateTextEvents();

        // // register notifications when user sends message on server channel
        // await client.send("servernotifyregister", {
        //     event: "textserver"
        // });

        // register notifications when user sends message on normal channel
        await client.send("servernotifyregister", {
            event: "textchannel"
        });

        // register server events notifications
        await client.send("servernotifyregister", {
            event: "server"
        });
        
        await client.send("servernotifyregister", {
            event: "channel",
            id: 0 // listen to all channels
        });

        const clientlist = await client.send("clientlist");

        // listening for server to be edited
        await client.on('serveredited', data => {
            console.log('Server edited!');
            if(data[0]) {
               console.log(data[0]);
            }
        });

        let musicBotInfo = clientlist.response.find((obj) => obj.client_nickname === "DJ Jaracz");

        const musicBotInfo2 = await client.send('clientinfo', {
            clid: musicBotInfo.clid
        });

        console.log(musicBotInfo2);

        if(musicBotInfo)
            await moveAdminTo(client, musicBotInfo.cid);
        else
        	console.error('DJ Jaracz not found');
        
        // listening for client move to other channel
	    client.on('clientmoved', data => {
	    	if(musicBotInfo && data[0] && data[0].clid === musicBotInfo.clid) {
                moveAdminTo(client, data[0].ctid).catch(console.error);
            }


	    });

        // listening for messages
        client.on("textmessage", data => {
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
