
import { cmd } from "lib/backend";

export default {
    desc: "Ensure faces are detected",
    args: [ "path" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const slashIndex = abspath.lastIndexOf("/");
        const lastPart = abspath.substr(slashIndex + 1);
        const items = lastPart.includes("*") ? await cmd.list(abspath) : [ await cmd.resolve(abspath, { nofollow: true }) ];

        for (const node of items) {
            streams.stdout.write(`Will try to migrate tags for ${node.name}...\n`);

            const countBefore = (node.attributes.faces || []).length;

            const faces = await cmd.migrateoldtags(node.path);

            streams.stdout.write(`${faces.length - countBefore} migrated!\n`);
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
