"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.all = params.list;
    this.albums = ko.pureComputed(() => this.all().filter((element) => element.node.properties.type === "a"));
    this.people = ko.pureComputed(() => this.all().filter((element) => element.node.properties.type === "p"));
    this.locations = ko.pureComputed(() => this.all().filter((element) => element.node.properties.type === "l"));
    this.cameras = ko.pureComputed(() => this.all().filter((element) => element.node.properties.type === "c"));
    this.vehicles = ko.pureComputed(() => this.all().filter((element) => element.node.properties.type === "v"));
    this.selected = ko.observable("all");

    this.dispose = () => {
    };
});
