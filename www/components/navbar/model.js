"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.loading;
    this.user = session.user;
    this.searchPaths = session.searchPaths;
    this.path = ko.pureComputed({
        read: () => {
            let page = ko.unwrap(loc.current().page);

            if (page === "node") {
                return ko.unwrap(loc.current().path);
            }

            return "";
        },
        write: (path) => {
            if (path) {
                loc.goto({ page: "node", path: path });
            } else {
                loc.goto({ page: "recent", path: null });
            }
        }
    });

    this.random = () => {
        api.vfs.random(session.searchPaths(), 1)
        .then((item) => {
            if (item) {
                loc.goto({ page: "node", path: item.path });
            } else {
                status.printError("No random node could be found");
            }
        });
    };
});
