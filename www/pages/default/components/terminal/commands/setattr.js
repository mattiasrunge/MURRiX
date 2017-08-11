
import api from "api.io-client";

export default {
    desc: "Set node attribute",
    args: [ "path", "name", "value" ],
    opts: {
        j: "Parse value as JSON"
    },
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const attributes = {};

        if (opts.j) {
            attributes[args.name] = JSON.parse(args.value);
        } else {
            attributes[args.name] = args.value;
        }

        await api.vfs.setattributes(abspath, attributes);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};