const { TeamSpeakClient } = require("node-ts");
const { getArgument } = require("./utils.js");
const { handleMessage } = require("./message_handler.js");

/**
 * @param {TeamSpeakClient} client
 * @param {number} channel_id
 * */
async function moveAdminTo(client, channel_id) {
    const clientList = await client.send("clientlist");
	let serverAdmin = clientList.response.find((obj) => {
		return obj.client_type === 1 && obj.client_nickname.match(/^serveradmin/i);
	});
	
	if (serverAdmin) {
		if (serverAdmin.cid !== channel_id)//if serverAdmin is not already in target channel
			await client.send('clientmove', {clid: serverAdmin.clid, cid: channel_id});
	}
	else
		console.error('Music bot or serverAdmin has not been found');
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
        
        // await client.subscribePrivateTextEvents();

        // register notifications when user sends message on server channel
        await client.send("servernotifyregister", {
            event: "textserver"
        });

        // register notifications when user sends message on normal channel
        await client.send("servernotifyregister", {
            event: "textchannel"
        });

        // register server events notifications
        await client.send("servernotifyregister", {
            event: "server"
        });

        const clientlist = await client.send("clientlist");

        // listening for server to be edited
        await client.on('serveredited', data => {
            console.log('Server edited!');
            if(data[0]) {
               console.log(data[0]);
            }
        });

        // listening for client move to other channel // TODO: not working
        await client.on('clientmoved', data => {
            console.log('Client moved!');
            if(data[0]) {
               console.log(data[0]);
            }
        });

        let musicBotInfo = clientlist.response.find((obj) => obj.client_nickname === "DJ Jaracz");
        if(musicBotInfo) {
            await moveAdminTo(client, musicBotInfo.cid);
            console.log('Admin moved to :', musicBotInfo.cid);
        }
        else
        	console.error('DJ Jaracz not found');


        // listening for messages
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
