"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.name = ko.pureComputed(() => ko.unwrap(params.name));
    this.nicename = ko.pureComputed(() => this.name().replace(/([A-Z])/g, " $1").toLowerCase());
    this.value = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return "";
        }

        return this.nodepath().node().attributes[this.name()];
    });
    this.editable = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return "";
        }

        return ko.unwrap(this.nodepath().editable);
    });

    this.change = (value) => {
        if (!this.editable() || this.value() === value) {
            return;
        }

        console.log("Saving attribute " + this.name() + ", old value was \"" + this.value() + "\", new value is \"" + value + "\"");

        let attributes = {};

        attributes[this.name()] = value;

        api.vfs.setattributes(this.nodepath().path, attributes)
        .then((node) => {
            this.nodepath().node(node);
            console.log("Saving attribute " + this.name() + " successfull!", node);
        })
        .catch((error) => {
            status.printError(error);
        });
    };

    this.setYes = () => {
        this.change(true);
    };

    this.setNo = () => {
        this.change(false);
    };

    this.dispose = () => {
    };
});
