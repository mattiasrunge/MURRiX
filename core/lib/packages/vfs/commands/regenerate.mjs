
import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Regenerate node
    opts, // o Overwrite existing metadata
    abspath = "" // AbsolutePath
) => {
    const nodes = await api.resolve(client, abspath, {
        list: true,
        noerror: true
    });

    for (let n = 0; n < nodes.length; n++) {
        if (term.hasInterrupt()) {
            break;
        }

        const node = nodes[n];

        term.writeln(`${nodes.length > 1 ? `[${n + 1}/${nodes.length}] ` : ""}Regenerating ${color.bold(node.name)}...`);
        await api.regenerate(client, node.path, {
            overwrite: opts.o
        });
    }
};
