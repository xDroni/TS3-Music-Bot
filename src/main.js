const { TeamSpeakClient } = require("node-ts");
const { getArgument } = require("./utils.js");

async function main(host, login, password) {
    console.log('test:', host);
    console.log('login:', login);
    console.log('password:', password);

    const client = new TeamSpeakClient(host);
    try {
        await client.connect();
        await client.send("use", {sid: 1});

        await client.send("login", {
                                    client_login_name: login,
                                    client_login_password: password
        });

        // const me = client.send("whoami");
        // me.then((result) => {
        //     console.log(result);
        // });
        //
        let hostinfo = await client.send("hostinfo");
        console.log(hostinfo);

        let clientlist = await client.send("clientlist");
        console.log(clientlist);


    } catch(err) {
        console.error("An error occurred: ");
        console.error(err);
    }
}

main(getArgument('host'), getArgument('login'), getArgument('password'));
