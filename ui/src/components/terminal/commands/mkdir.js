
import { cmd } from "lib/backend";

export default {
    desc: "Create a new directory node",
    args: [ "path" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        const parentpath = await cmd.dirname(abspath);
        const name = await cmd.basename(abspath);

        await cmd.create(parentpath, "d", name);
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
