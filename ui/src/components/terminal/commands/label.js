
import { cmd } from "lib/backend";

export default {
    desc: "Toggle label on node",
    args: [ "label", "?path" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await cmd.resolve(abspath, { nofollow: opts.l });
        const index = node.attributes.labels.indexOf(args.label);
        const labels = node.attributes.labels.slice(0);

        if (index === -1) {
            labels.push(args.label);
        } else {
            labels.splice(index, 1);
        }

        await cmd.update(abspath, { labels });

        await streams.stdout.write(index === -1 ? "Label added\n" : "Label removed\n");
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
