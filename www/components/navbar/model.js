"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.loading = stat.loading;
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
                loc.goto({ page: null, path: null });
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
                stat.printSuccess("Star created");
            } else {
                stat.printSuccess("Star removed");
            }
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    this.random = () => {
        api.vfs.random(session.searchPaths(), 1)
        .then((item) => {
            if (item) {
                loc.goto({ page: "node", path: item.path, section: null });
            } else {
                stat.printError("No random node could be found");
            }
        });
    };

    this.createShow = (type) => {
        this.createType(type);
        this.createName("");
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
            stat.printError("Name can not be empty");
            return;
        }

        if (this.createType() === "album") {
            promise = node.getUniqueName("/albums", attributes.name)
            .then((name) => {
                abspath = "/albums/" + name;
                return api.album.mkalbum(name, attributes);
            });
        } else if (this.createType() === "location") {
            promise = node.getUniqueName("/locations", attributes.name)
            .then((name) => {
                abspath = "/locations/" + name;
                return api.location.mklocation(name, attributes);
            });
        } else if (this.createType() === "person") {
            promise = node.getUniqueName("/people", attributes.name)
            .then((name) => {
                abspath = "/people/" + name;
                return api.people.mkperson(name, attributes);
            });
        } else if (this.createType() === "camera") {
            promise = node.getUniqueName("/cameras", attributes.name)
            .then((name) => {
                abspath = "/cameras/" + name;
                return api.camera.mkcamera(name, attributes);
            });
        } else {
            stat.printError("Unknwon create type");
            return;
        }

        promise
        .then(() => {
            this.createType("");
            this.createName("");
            this.createDescription("");

            $("#createModal").modal("hide");

            loc.goto({ page: "node", path: abspath, section: null });

            stat.printSuccess(attributes.name + " successfully created!");
        })
        .catch((error) => {
            stat.printError(error);
        });
    };
});
