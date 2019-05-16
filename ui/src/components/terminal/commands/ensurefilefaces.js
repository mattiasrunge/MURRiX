
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
            if (!node.attributes.faces) {
                streams.stdout.write(`No face info found for ${node.name}, will try to detect...\n`);

                const faces = await cmd.ensurefilefaces(node.path);

                streams.stdout.write(`${faces.length} faces found!\n`);
            }
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
