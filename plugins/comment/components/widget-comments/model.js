"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.path = ko.pureComputed(() => ko.unwrap(params.path));
    this.user = session.user;
    this.uid = ko.pureComputed(() => {
        if (!this.user()) {
            return false;
        }

        return this.user().attributes.uid;
    });
    this.rows = ko.pureComputed(() => ko.unwrap(params.rows) || 0);
    this.list = ko.observableArray();
    this.comment = ko.observable("");
    this.collapsed = ko.observable(this.rows() > 0);

    this.filtered = ko.pureComputed(() => {
       if (this.rows() === 0 || !this.collapsed()) {
           return this.list();
       }

       return this.list().slice(-this.rows());
    });

    this.post = (model, event) => {
        if (event.keyCode === 13 && !event.shiftKey) {
            this.loading(true);
            api.comment.comment(this.path(), this.comment())
            .then(() => {
                this.loading(false);
                this.comment("");
            })
            .catch((error) => {
                this.loading(false);
                stat.printError(error);
            });

            return false;
        }

        return true;
    };

    this.loading(true);
    let list = yield api.comment.list(this.path());
    this.loading(false);

    console.log("comments", list);

    this.list(list.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    }));

    let subscription = api.comment.on("new", (data) => {
        console.log(data);
        console.log(data.path, this.path());

        if (data.path === this.path()) {
            this.list.push({
                name: data.name,
                path: data.path,
                node: ko.observable(data.node)
            });
        }
    });

    this.dispose = () => {
        api.comment.off(subscription);
        stat.destroy(this.loading);
    };
});
