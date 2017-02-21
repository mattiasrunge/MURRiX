"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.section = params.section;
model.loading = stat.create();
model.reload = ko.observable(false);

model.createTitle = ko.observable("");
model.createType = ko.observable("generic");
model.createText = ko.observable("");
model.createTime = ko.observable(false);
model.createPersonPath = ko.observable(false);

model.metrics = ko.asyncComputed([], async (setter) => {
    if (!model.nodepath() || model.nodepath() === "") {
        return {};
    }

    setter({});

    model.loading(true);
    let metrics = await api.people.getMetrics(model.nodepath().path);
    model.loading(false);

    console.log("metrics", metrics);

    return metrics;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return {};
});

model.createEvent = () => {
    console.log("type", model.createType());
    console.log("title", model.createTitle());
    console.log("time", model.createTime());
    console.log("person", model.createPersonPath());
    console.log("text", model.createText());

    let basepath = model.nodepath().path + "/texts";
    let abspath = "";
    let attributes = {
        type: model.createType(),
        name: model.createTitle().trim(),
        text: model.createText().trim(),
        when: {
            manual: model.createTime()
        }
    };

    if (attributes.name === "") {
        stat.printError("Name can not be empty");
        return;
    }

    if (!attributes.when.manual) {
        throw new Error("An event must must have date/time set");
    }

    api.node.getUniqueName(basepath, attributes.name)
    .then((name) => {
        abspath = basepath + "/" + name;
        return api.text.mktext(abspath, attributes);
    })
    .then(() => {
        if (model.createPersonPath()) {
            return api.vfs.link(abspath, model.createPersonPath() + "/texts");
        }
    })
    .then(() => {
        model.createType("generic");
        model.createTitle("");
        model.createTime(false);
        model.createPersonPath(false);
        model.createText("");

        $("#createPeopleEventModal").modal("hide");

        model.reload(!model.reload());

        stat.printSuccess(attributes.name + " successfully created!");
    })
    .catch((error) => {
        stat.printError(error);
    });
};

const dispose = () => {
    stat.destroy(model.loading);
};
