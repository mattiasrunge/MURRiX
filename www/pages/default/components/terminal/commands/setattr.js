
import api from "api.io-client";

export default {
    desc: "Set node attribute",
    args: [ "path", "name", "value" ],
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const attributes = {};

        attributes[args.name] = args.value;

        await api.vfs.setattributes(abspath, attributes);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
