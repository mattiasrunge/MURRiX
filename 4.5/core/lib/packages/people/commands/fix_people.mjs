import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Fix node problems
    opts // f Fix family;p Fix partners
) => {
    assert(client.isAdmin(), "Only administrators can fix things");

    try {
        if (opts.f) {
            term.write("Fixing family...");
            await api.fixfamily(client);
        }

        if (opts.p) {
            term.write("Fixing partners...");
            await api.fixpartners(client);
        }
    } catch (error) {
        console.error(error);
        throw error;
    }

    term.write("Complete");
};
