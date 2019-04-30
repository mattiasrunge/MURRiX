
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
            streams.stdout.write(`Will try to migrate tags for ${node.name}...\n`);

            const countBefore = (node.attributes.faces || []).length;

            const faces = await api.media.migrateoldtags(node.path);

            streams.stdout.write(`${faces.length - countBefore} migrated!\n`);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
