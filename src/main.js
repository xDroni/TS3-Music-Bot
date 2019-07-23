const { TeamSpeakClient } = require("node-ts");
const {getArgument} = require("./utils.js");

async function main(host) {
    console.log('test:', host);
    
    const client = new TeamSpeakClient(host);
    try {
        await client.connect();
        await client.send("use", {sid: 1});

        await client.send("login", {
                                    client_login_name: 'test',
                                    client_login_password: 'test'
        });

        const me = client.send("whoami");
        console.log(me);

    } catch(err) {
        console.error("An error occurred: ");
        console.error(err);
    }
}

main(getArgument('host'));
