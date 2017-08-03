
import api from "api.io-client";

export default {
    desc: "Change mode bits for node",
    args: [ "mode", "path" ],
    opts: {
        r: "Recursive chmod"
    },
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const options = { recursive: opts.r };

        await api.vfs.chmod(abspath, parseInt(args.mode, 8), options);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
