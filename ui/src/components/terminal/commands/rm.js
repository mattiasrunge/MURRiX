
import { cmd } from "lib/backend";

export default {
    desc: "Remove a node",
    args: [ "path" ],
    opts: {
        f: "Remove without confirmation"
    },
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const slashIndex = abspath.lastIndexOf("/");
        const lastPart = abspath.slice(slashIndex + 1);
        const items = lastPart.includes("*") ? await cmd.list(abspath, {
            pattern: lastPart.replace(/\./g, "\\.").replace(/\*/g, ".*"),
            nofollow: true
        }) : [ await cmd.resolve(abspath, { nofollow: true }) ];

        for (const item of items) {
            if (opts.f) {
                await cmd.unlink(item.path);

                continue;
            }

            term.setPrompt({ prompt: `Are you sure you want to remove <span class='bold'>${item.name}</span>? [y/N]` });
            const answer = await streams.stdin.read();

            if (answer.toLowerCase() === "y") {
                await cmd.unlink(item.path);
            }
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
