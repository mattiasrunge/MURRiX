"use strict";

const main = require("./lib/main");
const argv = require("yargs")
.usage("Usage: $0 -h [hostname] -p [port]")
.example("$0 -h localhost -p 8080", "Connect to server on localhost:8080")
.help("help")
.strict()
.option("h", {
    alias: "hostname",
    default: "localhost",
    describe: "Server hostname",
    type: "string"
})
.option("p", {
    alias: "port",
    default: 8080,
    describe: "Server port",
    type: "number"
})
.option("s", {
    alias: "secure",
    default: false,
    describe: "Server uses https",
    type: "boolean"
})
.argv;

process
.on("SIGINT", () => { main.stop().then(process.exit); })
.on("SIGTERM", () => { main.stop().then(process.exit); });

main.start(argv)
.catch(function(error) {
    console.error("FATAL ERROR");
    console.error(error);
    console.error(error.stack);
    process.exit(255);
});
