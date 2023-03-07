import path from "node:path";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Move node or nodes
    opts,
    srcpath, // AbsolutePath
    dstpath // AbsolutePath
) => {
    const nodes = await api.resolve(client, srcpath, {
        list: true,
        noerror: true
    });

    for (const node of nodes) {
        if (term.hasInterrupt()) {
            break;
        }

        await api.move(client, node.path, path.join(dstpath, "/"));
    }
};
