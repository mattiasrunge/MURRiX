"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("update import <dbname> <filespath>", "Import old MURRiX v1 mongodb database.")
.action(vorpal.wrap(function*(session, args) {
    if (!args.dbname) {
        thrown new Error("Missing dbname parameter");
    }

    if (!args.filespath) {
        throw new Error("Missing filespath parameter");
    }

    // TODO: Make copy mode an option

    let result = yield api.update.import(args.dbname, args.filespath, "symlink");

    for (let name of Object.keys(result)) {
        this.log("Imported " + result[name] + " " + name);
    }
}));
