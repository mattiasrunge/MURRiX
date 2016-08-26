"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const chron = require("chron");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.editable = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return false;
        }

        return ko.unwrap(this.nodepath().editable);
    });

    this.value = ko.pureComputed({
        read: () => {
            if (!this.nodepath()) {
                return false;
            }

            return this.nodepath().node().attributes.when ? this.nodepath().node().attributes.when.manual : false;
        },
        write: (value) => {
            this.change(value);
        }
    });

    this.change = (value) => {
        if (!this.editable() || chron.time2str(this.value() || {}) === chron.time2str(value || {})) {
            return;
        }

        console.log("Saving attribute when, old value was \"" + JSON.stringify(this.value()) + "\", new value is \"" + JSON.stringify(value) + "\"");

        let when = this.nodepath().node().attributes.when || {};

        when.manual = value;

        api.vfs.setattributes(this.nodepath().path, { when: when })
        .then((node) => {
            // TODO: Do this serverside based on events
            if (node.properties.type === "f") {
                return api.file.regenerate(this.nodepath().path);
            }

            return node;
        })
        .then((node) => {
            this.nodepath().node(node);
            console.log("Saving attribute when successfull!", node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    this.dispose = () => {
    };
});
