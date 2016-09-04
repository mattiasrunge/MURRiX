"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("update import <dbname> <filespath> <copymode>", "Import old MURRiX v1 mongodb database.")
.action(vorpal.wrap(function*(session, args) {
    if (!args.dbname) {
        throw new Error("Missing dbname parameter");
    }

    if (!args.filespath) {
        throw new Error("Missing filespath parameter");
    }

    if (!args.copymode) {
        throw new Error("Missing copymode parameter, options are: symlink, rsymlink, link, copy, move");
    }

    let result = yield api.update.import(args.dbname, args.filespath, args.copymode);

    for (let name of Object.keys(result)) {
        this.log("Imported " + result[name] + " " + name);
    }
}));
