
import { cmd } from "lib/backend";

export default {
    desc: "Print node parent paths",
    args: [ "?path" ],
    opts: {
        l: "Don't follow links",
        i: "Path is an id"
    },
    exec: async (term, streams, command, opts, args) => {
        let id;

        if (!opts.i) {
            const abspath = await term.getAbspath(args.path, true);
            const node = await cmd.resolve(abspath, { nofollow: opts.l });

            id = node._id;
        } else {
            id = args.path;
        }

        const nodes = await cmd.lookup(id);

        for (const node of nodes) {
            await streams.stdout.write(`${node.path}\n`);
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
