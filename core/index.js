"use strict";

const path = require("path");
const main = require("./lib/main");
const packageData = require("../package.json");
const argv = require("yargs")
.usage("Usage: $0 -c [config]")
.example("$0 -c ../conf/config.json", "Start server with specific configuration file")
.help("help")
.strict()
.option("c", {
    alias: "config",
    default: path.relative(__dirname, path.join("..", "conf", "config.json")),
    describe: "Configuration file",
    type: "string"
})
.option("level", {
    default: "info",
    describe: "Log level",
    type: "string"
})
.argv;

process
.on("SIGINT", () => { main.stop().then(process.exit); })
.on("SIGTERM", () => { main.stop().then(process.exit); });

main.start(argv, packageData.version)
.catch(function(error) {
    console.error("FATAL ERROR");
    console.error(error);
    console.error(error.stack);
    process.exit(255);
});
