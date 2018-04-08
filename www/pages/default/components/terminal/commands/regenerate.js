
import api from "api.io-client";

export default {
    desc: "Regenerate node",
    args: [ "?path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        await api.vfs.regenerate(abspath);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
