const { sendPrivateMessage } = require("./utils");

let AFKRoomCid;

let AFKClients = [];

async function getAFKChannel(client) {
    const channellist = await client.send('channellist');
    for(let k in channellist.response) {
        let channelinfo = await client.send('channelinfo', {cid: channellist.response[k].cid});
        if(channelinfo.response[0].channel_topic === 'AFK ROOM') {
            console.log(`Afk room cid: ${channellist.response[k].cid}`);
            AFKRoomCid = channellist.response[k].cid;
            return channellist.response[k].cid;
        }
    }
    throw('AFK Channel not found');
}

async function AFKCheck(client) {
    const clientlist = await client.send('clientlist');
    for(let k in clientlist.response) {
        await client.send('clientinfo', { clid: clientlist.response[k].clid }).then(clientinfo => {
            if(clientinfo.response != null) {
                const info = clientinfo.response[0];
                if(info.client_type == 0 && info.client_idle_time > 10000 && (info.client_output_muted == 1 || info.client_away == 1)) {
                    moveAFK(client, clientlist, clientlist.response[k].clid, clientlist.response[k].cid)
                }
            }
        }).catch(err => console.log(err))
    }
}

async function moveAFK(client, clientList, clid, cid) {
    if(AFKRoomCid !== undefined) {
        let userToMove = clientList.response.find((obj) => {
            return obj.clid === clid;
        });
        if(userToMove) {
            if(userToMove.cid !== AFKRoomCid) {
                client.send('clientmove', {clid: clid, cid: AFKRoomCid});
                AFKClients.push({
                   clid: clid, //client id
                   cid: cid //channel id to move back
                });
                console.log(AFKClients);
                console.log(`${userToMove.client_nickname} moved to AFK channel, clid: ${AFKRoomCid}`);
                sendPrivateMessage(client, clid, `You have been moved to the AFK Room`);
            }
        }
    }
}

async function AFKChannelListener(client) {
    if(AFKRoomCid !== undefined) {
        const clientlist = await client.send("clientlist", {'-voice': '', '-away': ''});

        const clientToMove = clientlist.response.find((obj) => {
            return obj.cid === AFKRoomCid && obj.client_output_muted === 0 && obj.client_away === 0 && AFKClients.some(e => e.clid === obj.clid);
        });

        if(clientToMove !== undefined) {
            console.log(`clienttomove!=undefined`);
            const AFKClient = AFKClients.find((obj) => obj.clid === clientToMove.clid);
            if(AFKClient !== undefined) {
                console.log(AFKClient);
                await moveAFKBack(client, clientToMove.clid, AFKClient.cid);
                AFKClients = AFKClients.filter(obj => obj.clid !== clientToMove.clid);
                console.log(`afk clients: `, AFKClients);
            }
        }
    }
}

async function moveAFKBack(client, clid, cid) {
    client.send('clientmove', {clid: clid, cid: cid});
    sendPrivateMessage(client, clid, `Welcome back`);
}

module.exports = {
    getAFKChannel,
    AFKCheck,
    AFKChannelListener
};