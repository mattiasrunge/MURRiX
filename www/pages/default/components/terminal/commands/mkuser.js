
import api from "api.io-client";

export default {
    desc: "Create a new user",
    args: [ "username" ],
    exec: async (term, cmd, opts, args) => {
        const name = await term.ask("Name:");

        if (!name) {
            throw new Error("Name can not be empty");
        }

        await api.auth.mkuser(args.username, name);
    }
};
