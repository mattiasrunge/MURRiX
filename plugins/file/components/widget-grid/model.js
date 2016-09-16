"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");

model.loading = stat.create();
model.data = params.data;
model.size = params.size;
model.nodepath = params.nodepath;
model.requestId = Date.now();
model.progress = ko.observable(false);

model.list = ko.asyncComputed([], function*(setter) {
    model.requestId = Date.now();
    let requestId = model.requestId;

    setter([]);

    console.log(model.data());

    let files = model.data().files;
    let texts = model.data().texts;
    let ids = files.map((file) => file.node()._id);

    model.progress({
        total: ids.length,
        complete: 0,
        progress: 0
    });

    model.loading(true);

    let filenames = yield api.file.getMediaUrl(ids, {
        width: model.size,
        height: model.size,
        type: "image"
    }, model.requestId);

    if (model.requestId !== requestId) {
        return [];
    }

    model.loading(false);

    files = files.map((file) => {
        file.filename = filenames[file.node()._id] || false;
        return file;
    });

    utils.sortNodeList(files);

    session.list(files);

    utils.sortNodeList(texts);

    console.log("files", files);
    console.log("texts", texts);

    let days = {};

    for (let text of texts) {
        let day = text.node().attributes.time ? moment.utc(text.node().attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

        days[day] = days[day] || { texts: [], files: [], time: text.node().attributes.time };
        days[day].texts.push(text);
    }

    for (let file of files) {
        let day = file.node().attributes.time ? moment.utc(file.node().attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

        days[day] = days[day] || { texts: [], files: [], time: file.node().attributes.time };
        days[day].files.push(file);
    }

    days = Object.keys(days).map((key) => days[key]);

    days.sort((a, b) => {
        if (!a.time) {
            return -1;
        } else if (!b.time) {
            return 1;
        }

        return a.time.timestamp - b.time.timestamp;
    });

    console.log("days", days);

    return days;
}, (error) => {
    model.progress(false);
    model.loading(false);
    stat.printError(error);
    return [];
});

let subscription = api.file.on("media-progress", (event) => {
    if (model.requestId !== event.requestId) {
        return;
    }

    model.progress({
        total: event.total,
        complete: event.complete,
        progress: Math.min((event.complete / event.total) * 100, 100)
    });
});

const dispose = () => {
    api.file.off(subscription);
    stat.destroy(model.loading);
};
