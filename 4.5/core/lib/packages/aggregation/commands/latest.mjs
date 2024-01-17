import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";
import { datetimeAgo } from "../../../lib/format.mjs";

export default async (client, term,
    // Latest activity
    opts,
    count = 20 // Number
) => {
    const events = await api.latest(client, count);

    const header = [
        color.bold`Name`,
        color.bold`Who`,
        color.bold`When`
    ];

    const data = events
    .filter(({ type }) => type === "created")
    .map(({ node, username, time }) => ([
        node.attributes.name,
        username,
        datetimeAgo(time)
    ]));

    term.writeTable([ header, ...data ]);
};
