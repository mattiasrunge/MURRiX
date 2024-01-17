import path from "node:path";
import fs from "fs-extra";
import { createLog } from "../lib/log.mjs";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const log = createLog(import.meta.url);

const config = {};

const configInit = async (args) => {
    log.info(`Loading configuration from ${JSON.stringify(args.config)}...`);

    const defaults = JSON.parse(await fs.readFile(path.join(__dirname, "..", "..", "conf", "defaults.json")));
    const configFile = JSON.parse(await fs.readFile(path.join(__dirname, args.config)));

    Object.assign(config, defaults, configFile, args);

    try {
        const content = await fs.readFile("/etc/mcs.keys");
        config.mcs.keys = content.toString().split("\n").filter((l) => l);
    } catch {}
};

export default config;
export { configInit };
