
import api from "api.io-client";
import columnify from "columnify";

export default {
    desc: "Find albums that are empty",
    exec: async (term, streams/* , cmd, opts, args */) => {
        const nodes = await api.vfs.list("/albums", { nofollow: true });
        const found = [];

        for (const node of nodes) {
            const fnode = await api.vfs.resolve(`${node.path}/files`, { nofollow: true, noerror: true });
            const tnode = await api.vfs.resolve(`${node.path}/texts`, { nofollow: true, noerror: true });

            if (fnode.properties.children.length === 0 && tnode.properties.children.length === 0) {
                found.push(node);
            }
        }

        if (found.length === 0) {
            await streams.stdout.write("No empty albums found!");

            return;
        }

        const columns = columnify(found.map((item) => {
            return {
                name: item.node.attributes.name,
                path: item.path
            };
        }), {
            showHeaders: false,
            columnSplitter: "  "
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
