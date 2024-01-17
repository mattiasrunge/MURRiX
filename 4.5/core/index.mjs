Error.stackTraceLimit = Number.POSITIVE_INFINITY;

import path from "node:path";
import { fileURLToPath } from "node:url";
import { stop, start } from "./lib/main.mjs";
import yargs from "yargs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const argv = yargs().usage("Usage: $0 -c [config]")
.example("$0 -c ../conf/config.json", "Start server with specific configuration file")
.help("help")
.strict()
.option("c", {
    alias: "config",
    default: path.relative(__dirname, path.join("..", "..", "conf", "config.json")),
    describe: "Configuration file",
    type: "string"
})
.option("level", {
    default: "debug",
    describe: "Log level",
    type: "string"
})
.argv;

/* eslint-disable */

process
.on("SIGINT", () => stop().then(process.exit))
.on("SIGTERM", () => stop().then(process.exit));

start(argv)
.catch((error) => {
    console.error("FATAL ERROR");
    console.error(error);
    console.error(error.stack);
    process.exit(255);
});

/* eslint-enable */
