"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.personPath = ko.observable(false);
    this.editing = ko.observable(false);
    this.nodepath = ko.asyncComputed(false, function*(setter) {
        setter(false);

        let nodepath = yield api.people.getPartner(ko.unwrap(params.nodepath().path));

        if (!nodepath) {
            return false;
        }

        this.personPath(nodepath.path);

        return { path: nodepath.path, node: ko.observable(nodepath.node), editable: ko.observable(nodepath.editable) };
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    this.editable = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return false;
        }

        return ko.unwrap(this.nodepath().editable);
    });

    this.edit = () => {
        this.editing(true);
    };

    // TODO: Check params.nodepath().editable

    let subscription = this.personPath.subscribe((value) => {
        console.log("personPath", value);

        // TODO: Call setPartner and update params.nodepath().node
    });

    this.dispose = () => {
        subscription.dispose();
    };
});
