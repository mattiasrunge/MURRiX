import Node from "../../../lib/Node.mjs";

export default async (client, filtered = false) => Node.getTypes(filtered);
