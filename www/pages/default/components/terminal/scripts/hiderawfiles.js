
import api from "api.io-client";

export default {
    desc: "Find and hide raw images in album",
    args: [ "?path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath);

        if (node.properties.type !== "a") {
            throw new Error("Must be run on an album");
        }

        const filespath = `${abspath}/files`;
        const nodes = await api.vfs.list(filespath, { nofollow: true });

        await streams.stdout.write(`Found ${nodes.length} nodes\n`);

        const rawfiles = nodes.filter((file) => file.node.attributes.rawImage);
        const files = nodes.filter((file) => !file.node.attributes.rawImage);

        await streams.stdout.write(`Found ${rawfiles.length} raw files and ${files.length} non raw files\n`);

        for (const rawfile of rawfiles) {
            const name = rawfile.node.attributes.name;
            const basename = name.substr(0, name.lastIndexOf(".")) || name;

            await streams.stdout.write(`Will try to find file with basename ${basename}\n`);

            const file = files.find((file) => file.node.attributes.name.startsWith(basename));

            if (file) {
                await streams.stdout.write(`Found a non raw file that matches, ${file.node.attributes.name}, will move ${rawfile.node.attributes.name}\n`);

                const versionspath = `${file.path}/versions`;

                await api.vfs.ensure(versionspath, "d");
                await api.vfs.move(rawfile.path, versionspath);

                await streams.stdout.write("Done moving raw file!\n");
            } else {
                await streams.stdout.write("Found no file to match the raw file!\n");
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
