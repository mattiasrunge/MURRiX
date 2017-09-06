
import api from "api.io-client";

export default {
    desc: "Create a new group",
    args: [ "name" ],
    exec: async (term, streams, cmd, opts, args) => {
        const name = await term.ask("Name:");

        if (!name) {
            throw new Error("Name can not be empty");
        }

        await api.auth.mkgroup(args.name, name);
    }
};
