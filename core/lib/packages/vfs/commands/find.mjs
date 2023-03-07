
import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Find nodes
    opts,
    search // Generic
) => {
    const abspath = client.getCurrentDirectory();

    // TODO: Find should maybe be generator function so we can
    // abort and maybe
    const nodes = await api.find(client, abspath, search);

    const colorize = search.split("*");

    for (const node of nodes) {
        let path = node.path;

        for (const part of colorize) {
            path = path.split(part).join(color.bold.yellow(part));
        }

        term.writeln(path);
    }
};
