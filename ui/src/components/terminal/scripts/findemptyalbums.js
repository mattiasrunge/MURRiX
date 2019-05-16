
import columnify from "columnify";
import { cmd } from "lib/backend";

export default {
    desc: "Find albums that are empty",
    exec: async (term, streams/* , command, opts, args */) => {
        const nodes = await cmd.list("/albums", { nofollow: true });
        const found = [];

        for (const node of nodes) {
            const fnode = await cmd.resolve(`${node.path}/files`, { nofollow: true, noerror: true });
            const tnode = await cmd.resolve(`${node.path}/texts`, { nofollow: true, noerror: true });

            if (fnode.properties.children.length === 0 && tnode.properties.children.length === 0) {
                found.push(node);
            }
        }

        if (found.length === 0) {
            await streams.stdout.write("No empty albums found!");

            return;
        }

        const columns = columnify(found.map((item) => ({
            name: item.node.attributes.name,
            path: item.path
        })), {
            showHeaders: false,
            columnSplitter: "  "
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
