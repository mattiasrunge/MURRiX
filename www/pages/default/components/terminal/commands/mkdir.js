
import api from "api.io-client";

export default {
    desc: "Create a new directory node",
    args: [ "path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        const parentpath = await api.vfs.dirname(abspath);
        const name = await api.vfs.basename(abspath);

        await api.vfs.create(parentpath, "d", name);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
