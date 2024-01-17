import { resolve } from "node:path";
import Path from "./Path.mjs";

class AbsolutePath extends Path {
    static async transform(client, value) {
        return resolve(client.getCurrentDirectory(), value);
    }
}

export default AbsolutePath;
