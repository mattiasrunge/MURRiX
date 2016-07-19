"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");
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

        let list = yield api.vfs.list(session.searchPaths(), { filter: query });

        this.loading(false);

        return list.map((item) => {
            item.node = ko.observable(item.node);
            return item;
        });
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    }, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

    ui.setTitle("Search");

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
