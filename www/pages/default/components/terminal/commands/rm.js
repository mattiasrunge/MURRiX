
import api from "api.io-client";

export default {
    desc: "Remove a node",
    args: [ "path" ],
    opts: {
        f: "Force remove without confirmation"
    },
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const slashIndex = abspath.lastIndexOf("/");
        const lastPart = abspath.substr(slashIndex + 1);
        const items = lastPart.includes("*") ? await api.vfs.list(abspath) : [ await api.vfs.resolve(abspath) ];

        for (const item of items) {
            if (opts.f) {
                await api.vfs.unlink(item.path);

                return;
            }

            term.setPrompt({ prompt: `Are you sure you want to remove <span class='bold'>${item.name}</span>? [y/N]` });
            const answer = await streams.stdin.read();

            if (answer.toLowerCase() === "y") {
                await api.vfs.unlink(item.path);
            }
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
