import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Set node attribute
    opts, // j Parse value as JSON
    abspath, // AbsolutePath
    name, // Generic
    value // Generic
) => {
    const attributes = {};

    if (opts.j) {
        attributes[name] = JSON.parse(value);
    } else {
        attributes[name] = value;
    }

    await api.update(client, abspath, attributes);
};
