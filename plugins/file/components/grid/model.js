"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const moment = require("moment");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.path = params.path;
    this.size = params.size;

    this.list = ko.asyncComputed([], function*(setter) {
        if (!this.path() || this.path() === "") {
            return [];
        }

        setter([]);

        this.loading(true);

        let files = yield api.vfs.list(this.path() + "/files");
        let filenames = yield api.file.getPictureFilenames(files.map((file) => file.node._id), this.size, this.size);

        this.loading(false);

        files = files.map((file) => {
            let filename = filenames.filter((filename) => filename.id === file.node._id)[0];

            if (filename) {
                file.filename = filename.filename;
            }

            return file;
        });

        utils.sortNodeList(files)

        console.log("files", files);

        let texts = yield api.vfs.list(this.path() + "/texts");

        utils.sortNodeList(texts);

        console.log("texts", texts);


        let days = {};

        for (let text of texts) {
            let day = moment.utc(text.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD");

            days[day] = days[day] || { texts: [], files: [], day: text.node.attributes.time.timestamp };
            days[day].texts.push(text);
        }

        for (let file of files) {
            let day = moment.utc(file.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD");

            days[day] = days[day] || { texts: [], files: [], day: file.node.attributes.time.timestamp };
            days[day].files.push(file);
        }

        days = Object.keys(days).map((key) => days[key]);

        console.log("days", days);

        // TODO
        return days;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
