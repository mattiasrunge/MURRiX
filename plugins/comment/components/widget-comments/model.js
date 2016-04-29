"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const api = require("api.io-client");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;
    this.path = params.path;
    this.loading = status.create();
    this.newFlag = ko.observable(false);
    this.list = ko.asyncComputed([], function*() {
        this.newFlag();
        this.newFlag(false);
        return yield api.comment.list(ko.unwrap(this.path));
    }.bind(this), (error) => {
        status.printError(error);
        return [];
    });
    this.comment = ko.observable("");

    this.post = (model, event) => {
        if (event.keyCode === 13 && !event.shiftKey) {
            this.loading(true);
            api.comment.comment(this.path(), this.comment())
            .then(() => {
                this.loading(false);
                this.comment("");
                this.newFlag(true);
            })
            .catch((error) => {
                this.loading(false);
                status.printError(error);
            });

            return false;
        }

        return true;
    };

    this.dispose = () => {
        status.destroy(this.loading);
    };
});

