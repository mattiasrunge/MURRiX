"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.reloadFlag = ko.observable(false);
    this.personPath = ko.pureComputed({
        read: () => {
            return this.nodepath().path;
        },
        write: (path) => {
            if (!this.editing()) {
                return;
            }

            this.editing(false);

            if (path === this.nodepath().path) {
                return;
            }

            api.people.setPartner(ko.unwrap(params.nodepath().path), path)
            .then(() => {
                this.reloadFlag(!this.reloadFlag());
                console.log("Saving partner " + path + " successfull!");
            })
            .catch((error) => {
                stat.printError(error);
            });
        }
    });

    this.editing = ko.observable(false);
    this.nodepath = ko.asyncComputed(false, function*(setter) {
        setter(false);

        this.reloadFlag();

        let nodepath = yield api.people.getPartner(ko.unwrap(params.nodepath().path));

        if (!nodepath) {
            return false;
        }

        return { path: nodepath.path, node: ko.observable(nodepath.node), editable: ko.observable(nodepath.editable) };
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.editable = ko.pureComputed(() => {
        if (!params.nodepath()) {
            return false;
        }

        return ko.unwrap(params.nodepath().editable);
    });

    this.edit = () => {
        this.editing(true);
    };

    this.dispose = () => {
    };
});
