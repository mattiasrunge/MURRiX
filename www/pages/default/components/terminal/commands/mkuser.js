
import api from "api.io-client";

export default {
    desc: "Create a new user",
    args: [ "username" ],
    exec: async (term, cmd, opts, args) => {
        const name = await term.ask("Name:");

        if (!name) {
            throw new Error("Name can not be empty");
        }

        const groups = await term.ask("Groups:");

        await api.auth.mkuser(args.username, name);

        const list = groups.split(" ").filter((g) => g);

        for (const groupname of list) {
            await api.auth.connect(args.username, groupname);
        }
    }
};
