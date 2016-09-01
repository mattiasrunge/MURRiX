"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = params.nodepath;
    this.size = 226;

    this.filesPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/files" : false);
    this.files = ko.nodepathList(this.filesPath, { noerror: true });

    this.textsPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/texts" : false);
    this.texts = ko.nodepathList(this.textsPath, { noerror: true });

    this.data = ko.pureComputed(() => {
        let files = this.files();
        let texts = this.texts();

        return {
            files: this.files.hasLoaded() ? files : [],
            texts: this.texts.hasLoaded() ? texts : []
        };
    });

    this.dispose = () => {
        this.files.dispose();
        this.texts.dispose();
        stat.destroy(this.loading);
    };
});
