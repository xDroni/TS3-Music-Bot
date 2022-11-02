const {TeamSpeakClient} = require("node-ts");

const {getArgument, escapeRegExp, sendPrivateMessage, sendChannelMessage} = require("./utils");
const {handleChannelMessage, handlePrivateMessage} = require("./message_handler");

let botname = 'MusicBot';
let clientname = 'DJ Tiesto';

async function welcomeMessage(client, data, _maxOnline, _totalOnline) {
    let clientInfo = await client.send('clientinfo', {
        clid: data.clid
    });
    clientInfo = clientInfo.response[0];

    if (data.client_type !== 1) {
        let firstConnected = new Date(clientInfo.client_created * 1000);
        let lastConnected = new Date(clientInfo.client_lastconnected * 1000);
        let firstConnectedMonth = firstConnected.getMonth() + 1;
        let lastConnectedMonth = lastConnected.getMonth() + 1;

        const messageText = `\nYour first connection: ${firstConnected.getFullYear()}-${firstConnectedMonth < 10 ? '0' + firstConnectedMonth : firstConnectedMonth}-${firstConnected.getDate() < 10 ? '0' + firstConnected.getDate() : firstConnected.getDate()} at ${firstConnected.getHours() < 10 ? '0' + firstConnected.getHours() : firstConnected.getHours()} ${firstConnected.getMinutes() < 10 ? '0' + firstConnected.getMinutes() : firstConnected.getMinutes()}`
            + `\nYour last connection: ${lastConnected.getFullYear()}-${lastConnectedMonth < 10 ? '0' + lastConnectedMonth : lastConnectedMonth}-${lastConnected.getDate() < 10 ? '0' + lastConnected.getDate() : lastConnected.getDate()} at ${lastConnected.getHours() < 10 ? '0' + lastConnected.getHours() : lastConnected.getHours()} ${lastConnected.getMinutes() < 10 ? '0' + lastConnected.getMinutes() : lastConnected.getMinutes()}`
            + `\nIt's your ${clientInfo.client_totalconnections} visit here!`
            + `\nHave Fun! :D`;

        sendPrivateMessage(client, data.clid,
            `\n[b][color=#5D77FF]Hello ${clientInfo.client_nickname}![/color][/b] ${messageText}`);

        console.log(`clid: ${data.clid}  ${messageText}`);
    }
}

/**
 * @param {TeamSpeakClient} client
 * @param {number} channel_id
 * */
async function moveAdminTo(client, channel_id) {
    const clientList = await client.send("clientlist");
    const channelList = await client.send('channellist');

    let serverAdmin = (clientList.response || []).find((obj) => {
        return obj.client_type === 1 && obj.client_nickname.match(
            new RegExp(`^${escapeRegExp(botname)}`, 'i'));
    });

    if (serverAdmin) {
        if (serverAdmin.cid !== channel_id) {//if serverAdmin is not already in target channel
            await client.send('clientmove', {clid: serverAdmin.clid, cid: channel_id});
            let channel_name = channelList.response.find((obj) => obj.cid === channel_id).channel_name;
            console.log(`${botname} moved to: ${channel_name}, cid: ${channel_id}`);
        }
    } else
        console.error('Music bot or serverAdmin has not been found');
}

async function main(host, login, password, _botname, _clientname) {
    if (_botname) {
        botname = _botname;
        console.log(`Music bot name set to: ${botname}`);
    } else {
        console.log(`Music bot name set to default: ${botname}`);
    }

    if (_clientname) {
        clientname = _clientname;
        console.log(`Client name set to: ${clientname}`);
    } else {
        console.log(`Client name set to default: ${clientname}`);
    }

    const client = new TeamSpeakClient(host);

    process.on('uncaughtException', function (err) {
        console.log('Caught exception:', err);
        sendChannelMessage(client, 'Music bot restarted.');
        process.exit();
    });

    client.on('error', e => {
        console.log('Caught error:', err);
        sendChannelMessage(client, 'Music bot restarted.');
        process.exit();
    });

    await client.connect();
    await client.send("use", {sid: 1});

    await client.send("login", {
        client_login_name: login,
        client_login_password: password
    });
    await client.send("clientupdate", {client_nickname: botname});

    // register notifications when user sends private message
    await client.send("servernotifyregister", {
        event: "textprivate"
    });

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

    // listening for client to connect to the server
    await client.on('cliententerview', async (data) => {
        await welcomeMessage(client, data[0]);
    });

    let musicBotInfo = clientlist.response.find((obj) => obj.client_nickname === clientname);

    if (musicBotInfo) {
        await moveAdminTo(client, musicBotInfo.cid);
        sendChannelMessage(client, 'Music bot successfully started.');
    } else {
        console.error(`${clientname} not found`);
    }

    // listening for client move to other channel
    client.on('clientmoved', data => {
        if (musicBotInfo && data[0] && data[0].clid === musicBotInfo.clid) {
            moveAdminTo(client, data[0].ctid).catch(console.error);
        }
    });

    // listening for messages
    client.on("textmessage", data => {
        if (!data[0] || data[0].invokeruid === 'serveradmin')//ignore messages from serveradmin
            return;
        if (data[0].targetmode === 2)
            handleChannelMessage(client, data[0]);
        else if (data[0].targetmode === 1)
            handlePrivateMessage(client, data[0]);
    });

    // keeping connection alive every 4 min
    setInterval(() => {
        client.send("version");
    }, 240000);
}

main(
    getArgument('host'),
    getArgument('login'),
    getArgument('password'),
    getArgument('botname'),
    getArgument('clientname')
).catch(err => {
    console.error("An error occurred: ");
    console.error(err);
});
