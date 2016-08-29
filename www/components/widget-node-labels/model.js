"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.editing = ko.observable(false);
    this.labelString = ko.observable("");

    this.edit = () => {
        this.labelString(this.nodepath().node().attributes.labels.join(" "));
        this.editing(true);
    };

    this.save = () => {
        let labels = this.labelString().trim();
        let oldLabels = this.nodepath().node().attributes.labels.join(" ");

        this.editing(false);

        if (labels !== oldLabels) {
            console.log("Saving attribute labels, old value was \"" + oldLabels + "\", new value is \"" + labels + "\"");

            let attributes = {};

            attributes.labels = labels.split(" ");

            api.vfs.setattributes(this.nodepath().path, attributes)
            .then((node) => {
                this.nodepath().node(node);
                console.log("Saving attribute labels successfull!", node);
            })
            .catch((error) => {
                stat.printError(error);
            });
        }
    };

    this.dispose = () => {
    };
});
