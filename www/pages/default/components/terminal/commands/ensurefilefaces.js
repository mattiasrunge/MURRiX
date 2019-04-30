
import api from "api.io-client";

export default {
    desc: "Ensure faces are detected",
    args: [ "path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const slashIndex = abspath.lastIndexOf("/");
        const lastPart = abspath.substr(slashIndex + 1);
        const items = lastPart.includes("*") ? await api.vfs.list(abspath) : [ await api.vfs.resolve(abspath, { nofollow: true }) ];

        for (const node of items) {
            if (!node.attributes.faces) {
                streams.stdout.write(`No face info found for ${node.name}, will try to detect...\n`);

                const faces = await api.media.ensurefilefaces(node.path);

                streams.stdout.write(`${faces.length} faces found!\n`);
            }
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
