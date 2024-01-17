import Node from "../../../lib/Node.mjs";

export default async (client, type) => {
    const Type = Node.getType(type);

    return Type.getActionTypes();
};
