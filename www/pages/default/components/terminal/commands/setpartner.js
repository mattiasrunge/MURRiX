
import api from "api.io-client";

export default {
    desc: "Set or unset a persons partner",
    args: [ "abspath", "?partnerpath" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.abspath, false);
        const partnerpath = args.partnerpath ? await term.getAbspath(args.partnerpath, false) : null;

        const partner = await api.murrix.setpartner(abspath, partnerpath);
        const node = await api.vfs.resolve(abspath);

        if (partner) {
            streams.stdout.write(`${node.attributes.name} is now partner with ${partner.attributes.name}`);
        } else {
            streams.stdout.write(`${node.attributes.name} has no partner now`);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "abspath" || name === "partnerpath") {
            return await term.completePath(value);
        }

        return [];
    }
};
