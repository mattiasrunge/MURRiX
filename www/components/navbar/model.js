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
    this.createType = ko.observable("");
    this.createName = ko.observable("");
    this.createDescription = ko.observable("");
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
                loc.goto({ page: "node", path: path, section: null });
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
                status.printSuccess(node.nodepath().node().attributes.name + " starred");
            } else {
                status.printSuccess(node.nodepath().node().attributes.name + " unstarred");
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

    this.createShow = (type) => {
        this.createType(type);
        this.createName("")
        this.createDescription("");

        $("#createModal").modal("show");
    };

    this.create = () => {
        console.log("type", this.createType());
        console.log("name", this.createName());
        console.log("description", this.createDescription());

        let promise;
        let abspath = "";
        let attributes = {
            name: this.createName().trim(),
            description: this.createDescription().trim()
        };


        if (attributes.name === "") {
            status.printError("Name can not be empty");
            return;
        }

        if (this.createType() === "album") {
            promise = node.getUniqueName("/albums", this.createName())
            .then((name) => {
                abspath = "/albums/" + name;
                return api.album.mkalbum(name, attributes);
            });
        } else if (this.createType() === "location") {
            promise = node.getUniqueName("/locations", this.createName())
            .then((name) => {
                abspath = "/locations/" + name;
                return api.location.mklocation(name, attributes);
            });
        } else if (this.createType() === "person") {
            promise = node.getUniqueName("/people", this.createName())
            .then((name) => {
                abspath = "/people/" + name;
                return api.people.mkperson(name, attributes);
            });
        } else if (this.createType() === "camera") {
            promise = node.getUniqueName("/cameras", this.createName())
            .then((name) => {
                abspath = "/cameras/" + name;
                return api.camera.mkcamera(name, attributes);
            });
        } else {
            status.printError("Unknwon create type");
            return;
        }

        promise
        .then(() => {
            this.createType("");
            this.createName("")
            this.createDescription("");

            $("#createModal").modal("hide");

            loc.goto({ page: "node", path: abspath, section: null });

            status.printSuccess(attributes.name + " successfully created!");
        })
        .catch((error) => {
            status.printError(error);
        });
    };
});
