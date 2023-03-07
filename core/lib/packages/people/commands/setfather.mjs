import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Set or unset a persons father
    opts,
    person, // Person
    father = false // Person
) => {
    await api.setparent(client, person.path, "m", father?.path);

    if (father) {
        term.writeln(`${color.bold(father.attributes.name)} is now father to ${color.bold(person.attributes.name)}`);
    } else {
        term.writeln(`${color.bold(person.attributes.name)} has no father set anymore`);
    }
};
