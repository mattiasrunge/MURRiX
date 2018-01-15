
import api from "api.io-client";

export default {
    desc: "Create a new user",
    args: [ "username" ],
    exec: async (term, streams, cmd, opts, args) => {
        term.setPrompt({ prompt: "Name:" });
        const name = await streams.stdin.read();

        if (!name) {
            throw new Error("Name can not be empty");
        }

        term.setPrompt({ prompt: "Groups:" });
        const groups = await streams.stdin.read();

        await api.vfs.mkuser(args.username, name);

        const list = groups.split(" ").filter((g) => g);

        for (const groupname of list) {
            await api.vfs.usermod(args.username, groupname);
        }
    }
};
