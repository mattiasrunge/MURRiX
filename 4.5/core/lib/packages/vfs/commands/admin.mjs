import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term
// Give admin access
) => {
    const password = await term.ask("Admin password:", true);

    await api.admin(client, password);

    term.writeln(password ? color.green`Admin rights granted` : color.bold`Admin rights recinded`);
};
