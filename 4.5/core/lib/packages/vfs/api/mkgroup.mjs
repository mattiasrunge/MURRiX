import Node from "../../../lib/Node.mjs";

export default async (client, name, title, description = "") => {
    const groups = await Node.resolve(client, "/groups");

    const group = await groups.createChild(client, "g", name, {
        name: title,
        description
    });

    return group.serialize(client);
};
