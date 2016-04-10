"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.node = params.node;
    this.path = params.path;

    this.partnerPath = ko.asyncComputed(function*() {
        let path = this.path() + "/partner";
        let node = yield api.vfs.resolve(path, false, true);

        if (node && node.properties.type === "s") {
            path = node.attributes.path;
            node = yield api.vfs.resolve(path, false, true);
        }

        // TODO: Replace with a vfs.readlink call when available

        return path;
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    this.partner = ko.asyncComputed(function*() {
        if (!this.partnerPath()) {
            return false;
        }

        return yield api.vfs.resolve(this.partnerPath());
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    /*

    let loadPartner = () => {
        if (!this.partnerPath()) {
            return this.partner(false);
        }

        let path = this.partnerPath();

        api.vfs.resolve(this.partnerPath(), false, true)
        .then((partner) => {
            if (partner.properties.type === "s") {
                path = partner.attributes.path;
                return api.vfs.resolve(partner.attributes.path);
            }

            return partner;
        })
        .then((partner) => {
            this.partner({partner);
        })
        .catch((error) => {
            this.partner(false);
            status.printError(error);
        });
    };

    let subscription = this.partnerPath.subscribe(loadPartner);
    loadPartner();*/

    this.dispose = () => {
//         subscription.dispose();
    };
});
