import color from "../../../lib/color.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Set or unset a persons mother
    opts,
    person, // Person
    mother = false // Person
) => {
    await api.setparent(client, person.path, "f", mother?.path);

    if (mother) {
        term.writeln(`${color.bold(mother.attributes.name)} is now mother to ${color.bold(person.attributes.name)}`);
    } else {
        term.writeln(`${color.bold(person.attributes.name)} has no mother set anymore`);
    }
};
