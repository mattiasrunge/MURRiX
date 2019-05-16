
import { cmd } from "lib/backend";

export default {
    desc: "Create a new group",
    args: [ "name" ],
    exec: async (term, streams, command, opts, args) => {
        term.setPrompt({ prompt: "Name:" });
        const name = await streams.stdin.read();

        if (!name) {
            throw new Error("Name can not be empty");
        }

        await cmd.mkgroup(args.name, name);
    }
};
