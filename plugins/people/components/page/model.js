"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;
    this.loading = stat.create();
    this.reload = ko.observable(false);

    this.createTitle = ko.observable("");
    this.createType = ko.observable("generic");
    this.createText = ko.observable("");
    this.createTime = ko.observable(false);
    this.createPersonPath = ko.observable(false);

    this.metrics = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath() || this.nodepath() === "") {
            return {};
        }

        setter({});

        this.loading(true);
        let metrics = yield api.people.getMetrics(this.nodepath().path);
        this.loading(false);

        console.log("metrics", metrics);

        return metrics;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return {};
    });

    this.createEvent = () => {
        console.log("type", this.createType());
        console.log("title", this.createTitle());
        console.log("time", this.createTime());
        console.log("person", this.createPersonPath());
        console.log("text", this.createText());

        let basepath = this.nodepath().path + "/texts";
        let abspath = "";
        let attributes = {
            type: this.createType(),
            name: this.createTitle().trim(),
            text: this.createText().trim(),
            when: {
                manual: this.createTime()
            }
        };

        if (attributes.name === "") {
            stat.printError("Name can not be empty");
            return;
        }

        if (!attributes.when.manual) {
            throw new Error("An event must must have date/time set");
        }

        node.getUniqueName(basepath, attributes.name)
        .then((name) => {
            abspath = basepath + "/" + name;
            return api.text.mktext(abspath, attributes);
        })
        .then(() => {
            if (this.createPersonPath()) {
                return api.vfs.link(abspath, this.createPersonPath() + "/texts");
            }
        })
        .then(() => {
            this.createType("generic");
            this.createTitle("");
            this.createTime(false);
            this.createPersonPath(false);
            this.createText("");

            $("#createPeopleEventModal").modal("hide");

            this.reload(!this.reload());

            stat.printSuccess(attributes.name + " successfully created!");
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
