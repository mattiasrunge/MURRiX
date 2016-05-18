"use strict";

/* TODO:
 * Profile pictures for nodes
 * Search for more than people and locations
 */

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const api = require("api.io-client");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.query = ko.pureComputed({
        read: () => ko.unwrap(loc.current().query) || "",
        write: (value) => loc.goto( { query: value })
    });
    this.list = ko.asyncComputed([], function*() {
        if (this.query().length < 4) {
            return [];
        }

        let query = {};

        if (this.query().indexOf("label:") === 0) {
            let labels = this.query().replace(/label:/, "").split("+");

            if (labels.length === 0) {
                return [];
            }

            query = {
                "attributes.labels": { $in: labels }
            };
        } else {
            query = {
                "attributes.name": { $regex: ".*" + this.query() + ".*", $options: "-i" }
            };
        }

        this.loading(true);

        let list = yield api.vfs.list(session.searchPaths(), false, query);

        this.loading(false);

        return list;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    }, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
