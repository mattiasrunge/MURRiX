
import api from "api.io-client";

export default {
    desc: "Create a new directory node",
    args: [ "path" ],
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        await api.vfs.create(abspath, "d");
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
