"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const api = require("api.io-client");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.path = session.path;
    this.type = ko.pureComputed(() => {
        return this.node() ? this.node().properties.type : false;
    });
    this.section = ko.pureComputed(() => {
        return ko.unwrap(loc.current().section) || "default";
    });
    this.node = session.node;

    let load = (path) => {
        if (!path) {
            return this.node(false);
        }

        this.loading(true);
        api.vfs.resolve(path, true)
        .then((node) => {
            this.loading(false);
            this.node(node);
        })
        .catch((error) => {
            this.loading(false);
            this.node(false);
            status.printError(error);
        });
    };

    let subscription = this.path.subscribe(load);
    load(this.path());

    this.dispose = () => {
        status.destroy(this.loading);
        subscription.dispose();
    };
});
