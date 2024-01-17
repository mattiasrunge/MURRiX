import Node from "../../../lib/Node.mjs";

export default async (client, abspath, options = {}) => Node.exists(client, abspath, options);
