
import { cmd } from "lib/backend";

export default {
    desc: "Create a new user",
    args: [ "username" ],
    exec: async (term, streams, command, opts, args) => {
        term.setPrompt({ prompt: "Name:" });
        const name = await streams.stdin.read();

        if (!name) {
            throw new Error("Name can not be empty");
        }

        term.setPrompt({ prompt: "Groups:" });
        const groups = await streams.stdin.read();

        await cmd.mkuser(args.username, name);

        const list = groups.split(" ").filter((g) => g);

        for (const groupname of list) {
            await cmd.usermod(args.username, groupname);
        }
    }
};
