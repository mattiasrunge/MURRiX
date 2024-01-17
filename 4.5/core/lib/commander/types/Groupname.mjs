import { api } from "../../api/index.mjs";
import Generic from "./Generic.mjs";

class Groupname extends Generic {
    static async completer(client, partial) {
        const groups = await api.groups(client);

        const names = groups
        .map(({ name }) => name)
        .filter((name) => name.startsWith(partial));

        if (names.length === 1 && names[0] === partial) {
            return [ [ " " ], "" ];
        }

        return [ names, partial ];
    }
}

export default Groupname;
