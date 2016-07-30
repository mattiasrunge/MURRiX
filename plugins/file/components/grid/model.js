﻿"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.data = params.data;
    this.size = params.size;

    this.list = ko.asyncComputed([], function*(setter) {
        setter([]);

        console.log(this.data());

        let files = this.data().files;
        let texts = this.data().texts;

        this.loading(true);

        let filenames = yield api.file.getPictureFilenames(files.map((file) => file.node._id), this.size, this.size);

        this.loading(false);

        files = files.map((file) => {
            let filename = filenames.filter((filename) => filename.id === file.node._id)[0];

            if (filename) {
                file.filename = filename.filename;
            }

            return file;
        });

        utils.sortNodeList(files);

        node.list(files);

        utils.sortNodeList(texts);

        console.log("files", files);
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

        days.sort((a, b) => {
            return a.day - b.day;
        });

        console.log("days", days);

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
