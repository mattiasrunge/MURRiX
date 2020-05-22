
import { cmd } from "lib/backend";

export default {
    desc: "Move a node",
    args: [ "srcpath", "dstpath" ],
    opts: {
        f: "Move without confirmation"
    },
    exec: async (term, streams, command, opts, args) => {
        const srcpath = await term.getAbspath(args.srcpath, false);
        const dstpath = await term.getAbspath(args.dstpath, false);

        const slashIndex = srcpath.lastIndexOf("/");
        const lastPart = srcpath.slice(slashIndex + 1);
        const items = lastPart.includes("*") ? await cmd.list(srcpath, {
            pattern: lastPart.replace(/\./g, "\\.").replace(/\*/g, ".*"),
            nofollow: true
        }) : [ await cmd.resolve(srcpath, { nofollow: true }) ];

        for (const item of items) {
            if (opts.f) {
                await cmd.move(item.path, dstpath);

                continue;
            }

            term.setPrompt({ prompt: `Are you sure you want to move <span class='bold'>${item.name}</span> to ${args.dstpath}? [y/N]` });
            const answer = await streams.stdin.read();

            if (answer.toLowerCase() === "y") {
                await cmd.move(item.path, dstpath);
            }
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "srcpath" || name === "dstpath") {
            return await term.completePath(value);
        }

        return [];
    }
};
