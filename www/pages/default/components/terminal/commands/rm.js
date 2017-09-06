
import api from "api.io-client";

export default {
    desc: "Remove a node",
    args: [ "path" ],
    opts: {
        f: "Force remove without confirmation"
    },
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        if (opts.f) {
            await api.vfs.unlink(abspath);

            return;
        }

        term.setPrompt({ prompt: `Are you sure you want to remove <span class='bold'>${abspath}</span>? [y/N]` });
        const answer = await streams.stdin.read();

        if (answer.toLowerCase() === "y") {
            await api.vfs.unlink(abspath);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
