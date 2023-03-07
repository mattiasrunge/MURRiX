import { v4 as uuid } from "uuid";
import Node from "../../../lib/Node.mjs";

export default async (client, abspaths, id = uuid()) => {
    for (const abspath of abspaths) {
        const node = await Node.resolve(client, abspath, { nofollow: true });

        await node.setGroup(client, id);
    }
};
