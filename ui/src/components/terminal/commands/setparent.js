
import { cmd } from "lib/backend";

export default {
    desc: "Set or unset a persons parent",
    args: [ "abspath", "gender", "?parentpath" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.abspath, false);
        const parentpath = args.parentpath ? await term.getAbspath(args.parentpath, false) : null;

        const parent = await cmd.setparent(abspath, args.gender, parentpath);
        const node = await cmd.resolve(abspath);

        if (parent) {
            streams.stdout.write(`${parent.attributes.name} is now parent to ${node.attributes.name}`);
        } else {
            streams.stdout.write(`${node.attributes.name} has one less parent`);
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "abspath" || name === "parentpath") {
            return await term.completePath(value);
        } else if (name === "gender") {
            return [ "f", "m" ];
        }

        return [];
    }
};
