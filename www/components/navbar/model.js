"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.loading;
    this.user = session.user;
    this.searchPaths = session.searchPaths;
    this.stars = session.stars;
    this.loggedIn = session.loggedIn;
    this.path = ko.pureComputed({
        read: () => {
            let page = ko.unwrap(loc.current().page);

            if (page === "node") {
                return ko.unwrap(loc.current().path);
            }

            return "";
        },
        write: (path) => {
            console.log("write", path);
            if (path) {
                loc.goto({ page: "node", path: path });
            } else {
                loc.goto({ page: "recent", path: null });
            }
        }
    });
    this.starred = ko.pureComputed(() => {
        if (this.path() !== "") {
            for (let star of session.stars()) {
                if (star.path === this.path()) {
                    return true;
                }
            }
        }

        return false;
    });

    this.toggleStar = () => {
        api.auth.toggleStar(this.path())
        .then((result) => {
            session.stars(result.stars);

            if (result.created) {
                status.printSuccess(node.nodepath().node.attributes.name + " starred");
            } else {
                status.printSuccess(node.nodepath().node.attributes.name + " unstarred");
            }
        })
        .catch((error) => {
            status.printError(error);
        });
    };

    this.random = () => {
        api.vfs.random(session.searchPaths(), 1)
        .then((item) => {
            if (item) {
                loc.goto({ page: "node", path: item.path, section: null });
            } else {
                status.printError("No random node could be found");
            }
        });
    };
});
