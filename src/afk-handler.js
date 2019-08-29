const { sendPrivateMessage } = require("./utils");

let AFKRoomCid;

let AFKClients = [];

async function getAFKChannel(client) {
    const channellist = await client.send('channellist');
    for(let k=0; k<channellist.response.length; k++) {
        let channelinfo = await client.send('channelinfo', {cid: channellist.response[k].cid});
        if(channelinfo.response[0].channel_topic === 'AFK ROOM') {
            //console.log(`Afk room cid: ${channellist.response[k].cid}`);
            AFKRoomCid = channellist.response[k].cid;
            return channellist.response[k].cid;
        }
    }
    throw new Error('AFK Channel not found');
}

async function AFKCheck(client) {
    const clientlist = await client.send('clientlist');
    for(let k=0; k<clientlist.response.length; k++) {
        let clientinfo = await client.send('clientinfo', { clid: clientlist.response[k].clid }).catch(console.error);
        if (clientinfo.response !== null && clientinfo.response.length > 0) {
            const info = clientinfo.response[0];
            // noinspection JSUnresolvedVariable
            if (info.client_type === 0 && info.client_idle_time > 180000 && // incactive for 3 minutes
                (info.client_output_muted === 1 || info.client_away === 1))
            {
                await moveAFK(client, clientlist, clientlist.response[k].clid, clientlist.response[k].cid);
            }
        }
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
                console.log(`${userToMove.client_nickname} moved to AFK channel, clid: ${AFKRoomCid}`);
                sendPrivateMessage(client, clid, `You have been moved to the AFK Room`);
            }
        }
    }
}

async function AFKChannelListener(client) {
    if(AFKRoomCid !== undefined) {
        const clientlist = await client.send("clientlist", {'-voice': '', '-away': ''});
        
        for(let cl of clientlist.response) {
            if( cl.cid === AFKRoomCid && cl.client_output_muted === 0 && cl.client_away === 0 &&
                AFKClients.some(e => e.clid === cl.clid) )
            {
                const AFKClientIndex = AFKClients.findIndex((obj) => obj.clid === cl.clid);
                if(AFKClientIndex !== -1) {
                    await moveAFKBack(client, cl.clid, AFKClients[AFKClientIndex].cid);
                    AFKClients.splice(AFKClientIndex, 1);
                }
            }
        }

        /*const clientToMove = clientlist.response.find((obj) => {
            return obj.cid === AFKRoomCid && obj.client_output_muted === 0 && obj.client_away === 0 &&
                AFKClients.some(e => e.clid === obj.clid);
        });

        if(clientToMove !== undefined) {
            const AFKClient = AFKClients.find((obj) => obj.clid === clientToMove.clid);
            if(AFKClient !== undefined) {
                await moveAFKBack(client, clientToMove.clid, AFKClient.cid);
                AFKClients = AFKClients.filter(obj => obj.clid !== clientToMove.clid);
            }
        }*/
    }
}

async function moveAFKBack(client, clid, cid) {
    await client.send('clientmove', {clid: clid, cid: cid});
    sendPrivateMessage(client, clid, `Welcome back`);
}

module.exports = {
    getAFKChannel,
    AFKCheck,
    AFKChannelListener
};