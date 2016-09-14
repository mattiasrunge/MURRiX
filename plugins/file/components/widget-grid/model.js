"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.data = params.data;
    this.size = params.size;
    this.nodepath = params.nodepath;
    this.requestId = Date.now();
    this.progress = ko.observable(false);

    this.list = ko.asyncComputed([], function*(setter) {
        this.requestId = Date.now();
        let requestId = this.requestId;

        setter([]);

        console.log(this.data());

        let files = this.data().files;
        let texts = this.data().texts;
        let ids = files.map((file) => file.node()._id);

        this.progress({
            total: ids.length,
            complete: 0,
            progress: 0
        });

        this.loading(true);

        let filenames = yield api.file.getMediaUrl(ids, {
            width: this.size,
            height: this.size,
            type: "image"
        }, this.requestId);

        if (this.requestId !== requestId) {
            return [];
        }

        this.loading(false);

        files = files.map((file) => {
            file.filename = filenames[file.node()._id] || false;
            return file;
        });

        utils.sortNodeList(files);

        node.list(files);

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
    }.bind(this), (error) => {
        this.progress(false);
        this.loading(false);
        stat.printError(error);
        return [];
    });

    let subscription = api.file.on("media-progress", (event) => {
        if (this.requestId !== event.requestId) {
            return;
        }

        this.progress({
            total: event.total,
            complete: event.complete,
            progress: Math.min((event.complete / event.total) * 100, 100)
        });
    });

    this.dispose = () => {
        api.file.off(subscription);
        stat.destroy(this.loading);
    };
});
