
import api from "api.io-client";

export default {
    desc: "Create a new group",
    args: [ "name" ],
    exec: async (term, streams, cmd, opts, args) => {
        term.setPrompt({ prompt: "Name:" });
        const name = await streams.stdin.read();

        if (!name) {
            throw new Error("Name can not be empty");
        }

        await api.vfs.mkgroup(args.name, name);
    }
};
