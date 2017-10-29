
import api from "api.io-client";

export default {
    desc: "Find and hide images in album based on pattern",
    args: [ "unique_str", "?path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath);

        if (node.properties.type !== "a") {
            throw new Error("Must be run on an album");
        }

        const filespath = `${abspath}/files`;
        const nodes = await api.vfs.list(filespath, { nofollow: true });

        await streams.stdout.write(`Found ${nodes.length} nodes\n`);

        const files = nodes.filter((file) => file.node.attributes.name.match(`(.*)(${args.unique_str})(.*)`));
        const hidefiles = nodes.filter((file) => !file.node.attributes.name.match(`(.*)(${args.unique_str})(.*)`));

        await streams.stdout.write(`Found ${hidefiles.length} files to hide and ${files.length} files to show\n`);

        for (const file of files) {
            const pattern = file.node.attributes.name.replace(args.unique_str, ".*?");

            await streams.stdout.write(`Will try to find files that match pattern ${pattern}\n`);

            const hfiles = hidefiles.filter((hfile) => hfile.node.attributes.name.match(pattern));

            for (const hfile of hfiles) {
                await streams.stdout.write(`Found a file that matches, ${file.node.attributes.name}, will move ${hfile.node.attributes.name}\n`);

                const versionspath = `${file.path}/versions`;

                await api.vfs.ensure(versionspath, "d");
                await api.vfs.move(hfile.path, versionspath);

                await streams.stdout.write("Done moving file!\n");
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
