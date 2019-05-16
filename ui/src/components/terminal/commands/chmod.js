
import { cmd } from "lib/backend";

export default {
    desc: "Change mode bits for node",
    args: [ "mode", "path" ],
    opts: {
        r: "Recursive chmod"
    },
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const options = { recursive: opts.r };

        await cmd.chmod(abspath, parseInt(args.mode, 8), options);
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
