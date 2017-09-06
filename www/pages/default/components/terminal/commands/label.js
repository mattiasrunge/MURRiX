
import api from "api.io-client";

export default {
    desc: "Toggle label on node",
    args: [ "label", "?path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath, { nofollow: opts.l });

        if (node.attributes.labels.includes(args.label)) {
            node.attributes.labels = node.attributes.labels.filter((l) => l !== args.label);
        } else {
            node.attributes.labels.push(args.label);
        }

        await api.vfs.setattributes(abspath, node.attributes);

        await streams.stdout.write(node.attributes.labels.includes(args.label) ? "Label added\n" : "Label removed\n");
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
