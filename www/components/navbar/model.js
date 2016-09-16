"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

model.loading = stat.loading;
model.user = session.user;
model.searchPaths = session.searchPaths;
model.stars = session.stars;
model.loggedIn = session.loggedIn;
model.createType = ko.observable("");
model.createName = ko.observable("");
model.createDescription = ko.observable("");
model.path = ko.pureComputed({
    read: () => loc.current().page === "node" ? loc.current().path: "",
    write: (path) => loc.goto(path ? { page: "node", path: path } : {}, false)
});
model.starred = ko.pureComputed(() => {
    if (model.path() !== "") {
        for (let star of session.stars()) {
            if (star.path === model.path()) {
                return true;
            }
        }
    }

    return false;
});

model.toggleStar = () => {
    api.auth.toggleStar(model.path())
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

model.random = () => {
    api.vfs.random(session.searchPaths(), 1)
    .then((item) => {
        if (item) {
            loc.goto({ page: "node", path: item.path }, false);
        } else {
            stat.printError("No random node could be found");
        }
    });
};

model.createShow = (type) => {
    model.createType(type);
    model.createName("");
    model.createDescription("");

    $("#createModal").modal("show");
};

model.create = () => {
    console.log("type", model.createType());
    console.log("name", model.createName());
    console.log("description", model.createDescription());

    let promise;
    let abspath = "";
    let attributes = {
        name: model.createName().trim(),
        description: model.createDescription().trim()
    };


    if (attributes.name === "") {
        stat.printError("Name can not be empty");
        return;
    }

    if (model.createType() === "album") {
        promise = api.node.getUniqueName("/albums", attributes.name)
        .then((name) => {
            abspath = "/albums/" + name;
            return api.album.mkalbum(name, attributes);
        });
    } else if (model.createType() === "location") {
        promise = api.node.getUniqueName("/locations", attributes.name)
        .then((name) => {
            abspath = "/locations/" + name;
            return api.location.mklocation(name, attributes);
        });
    } else if (model.createType() === "person") {
        promise = api.node.getUniqueName("/people", attributes.name)
        .then((name) => {
            abspath = "/people/" + name;
            return api.people.mkperson(name, attributes);
        });
    } else if (model.createType() === "camera") {
        promise = api.node.getUniqueName("/cameras", attributes.name)
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
        model.createType("");
        model.createName("");
        model.createDescription("");

        $("#createModal").modal("hide");

        loc.goto({ page: "node", path: abspath }, false);

        stat.printSuccess(attributes.name + " successfully created!");
    })
    .catch((error) => {
        stat.printError(error);
    });
};
