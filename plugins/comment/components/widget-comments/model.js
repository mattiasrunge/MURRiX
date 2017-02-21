"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");

model.loading = stat.create();
model.path = ko.pureComputed(() => ko.unwrap(params.path));
model.user = session.user;
model.uid = ko.pureComputed(() => {
    if (!model.user()) {
        return false;
    }

    return model.user().attributes.uid;
});
model.rows = ko.pureComputed(() => ko.unwrap(params.rows) || 0);
model.list = ko.observableArray();
model.comment = ko.observable("");
model.collapsed = ko.observable(model.rows() > 0);

model.filtered = ko.pureComputed(() => {
    if (model.rows() === 0 || !model.collapsed()) {
        return model.list();
    }

    return model.list().slice(-model.rows());
});

model.post = (model, event) => {
    if (event.keyCode === 13 && !event.shiftKey) {
        model.loading(true);
        api.comment.comment(model.path(), model.comment())
        .then(() => {
            model.loading(false);
            model.comment("");
        })
        .catch((error) => {
            model.loading(false);
            stat.printError(error);
        });

        return false;
    }

    return true;
};

model.loading(true);
let list = await api.comment.list(model.path());
model.loading(false);

console.log("comments", list);

model.list(list.map((item) => {
    item.node = ko.observable(item.node);
    return item;
}));

let subscription = api.comment.on("new", (data) => {
    console.log(data);
    console.log(data.path, model.path());

    if (data.path === model.path()) {
        model.list.push({
            name: data.name,
            path: data.path,
            node: ko.observable(data.node)
        });
    }
});

const dispose = () => {
    api.comment.off(subscription);
    stat.destroy(model.loading);
};
