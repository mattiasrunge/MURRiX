
import api from "api.io-client";

export default {
    desc: "Remove a node",
    args: [ "path" ],
    opts: {
        f: "Force remove without confirmation"
    },
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        if (opts.f) {
            await api.vfs.unlink(abspath);

            return;
        }

        const answer = await term.ask(`Are you sure you want to remove <span class='bold'>${abspath}</span>? [y/N]`);

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
