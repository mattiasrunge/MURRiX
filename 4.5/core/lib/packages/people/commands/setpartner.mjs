import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Set or unset a persons partner
    opts,
    person, // Person
    partner = false // Person
) => {
    await api.setpartner(client, person.path, partner?.path);

    if (partner) {
        term.writeln(`${color.bold(person.attributes.name)} is now partner with ${color.bold(partner.attributes.name)}`);
    } else {
        term.writeln(`${color.bold(person.attributes.name)} has no partner now`);
    }
};
