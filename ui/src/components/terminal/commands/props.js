
import { cmd } from "lib/backend";

export default {
    desc: "Print node properties",
    args: [ "?path" ],
    opts: {
        l: "Don't follow links"
    },
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await cmd.resolve(abspath, { nofollow: opts.l });

        await streams.stdout.write(JSON.stringify(node.properties, null, 2));
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
