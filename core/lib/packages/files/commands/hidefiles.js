"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Find and hide images in album based on pattern
    opts,
    pattern, // Generic
    abspath = "" // AbsolutePath
) => {
    const nodes = await api.list(client, abspath, {
        nofollow: true,
        query: {
            "properties.type": "f"
        }
    });

    term.write(`Found ${nodes.length} nodes`);

    const files = nodes.filter((file) => file.node.attributes.name.match(`(.*)(${pattern})(.*)`));
    const hidefiles = nodes.filter((file) => !file.node.attributes.name.match(`(.*)(${pattern})(.*)`));

    term.write(`Found ${files.length} files to keep visible and ${hidefiles.length} files that are candidates for being hidden`);

    for (const file of files) {
        const patternReg = file.node.attributes.name.replace(pattern, ".*?");

        term.write(`Will try to find files that match pattern ${patternReg}`);

        const hfiles = hidefiles.filter((hfile) => hfile.node.attributes.name.match(patternReg));

        for (const hfile of hfiles) {
            term.write(`Found a file that matches, ${file.node.attributes.name}, will move ${hfile.node.attributes.name}`);

            const versionspath = `${file.path}/versions`;

            await api.ensure(client, versionspath, "d");
            await api.move(client, hfile.path, versionspath);

            term.write("Done hiding file!");
        }
    }
};
