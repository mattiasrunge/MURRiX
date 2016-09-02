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

    this.list = ko.asyncComputed([], function*(setter) {
        setter([]);

        console.log(this.data());

        let files = this.data().files;
        let texts = this.data().texts;
        let ids = files.map((file) => file.node()._id);

        this.loading(true);

        let filenames = yield api.file.getMediaUrl(ids, {
            width: this.size,
            height: this.size,
            type: "image"
        });

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
            return a.day - b.day;
        });

        console.log("days", days);

        return days;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return [];
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
