
import api from "api.io-client";
import format from "lib/format";

export default {
    desc: "Latest activity",
    args: [ "?count" ],
    exec: async (term, streams, cmd, opts, args) => {
        const events = await api.murrix.latest(parseInt(args.count || 20, 10));

        for (const event of events) {
            if (event.type === "created") {
                await streams.stdout.write(`${event.username} created '${event.node.attributes.name}' ${format.datetimeAgo(event.time)}\n`);
            }
        }
    }
};
