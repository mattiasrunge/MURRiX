"use strict";

const ko = require("knockout");
const Mprogress = require("mprogress");
const $ = require("jquery");
require("snackbar");

let mprogress = new Mprogress({ template: 4 });
let list = ko.observableArray();

module.exports = {
    printError: (text) => {
        console.error(text);

        let options = {
            content: text,
            style: "alert-danger",
            timeout: 10000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    printSuccess: (text) => {
        console.log(text);

        let options = {
            content: text,
            style: "alert-success",
            timeout: 5000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    printWarning: (text) => {
        console.log(text);

        let options = {
            content: text,
            style: "alert-warning",
            timeout: 5000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    printInfo: (text) => {
        console.log(text);

        let options = {
            content: text,
            style: "alert-info",
            timeout: 5000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    create: () => {
        let line = "unnamed"; //new Error().stack.split("\n")[2].trim().split(" ")[2];
        //line = line.substr(1, line.length - 2);

        let status = ko.observable(false);
        list.push({ status: status, name: line });
        return status;
    },
    destroy: (status) => {
        let item = list().filter((item) => item.status === status)[0];

        if (item) {
            list.remove(item);
        }
    },
    loading: ko.computed(() => {
        let loading = list().filter((item) => item.status()).length > 0;

        //console.log("status", JSON.stringify(list().map((item) => item.name + " => " + ko.unwrap(item.status)), null, 2));

        if (loading) {
            mprogress.start();
        } else {
            mprogress.end();
        }

        return loading;
    })
};
