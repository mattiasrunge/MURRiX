
import { cmd } from "lib/backend";

export default {
    desc: "Regenerate node",
    args: [ "?path" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        await cmd.regenerate(abspath);
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
