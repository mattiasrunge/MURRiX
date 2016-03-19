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
            content: "<strong>Error:</strong> " + text,
            style: "alert-danger",
            timeout: 10000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    printSuccess: (text) => {
        console.log(text);

        let options = {
            content: "<strong>Success:<//strong> " + text,
            style: "alert-success",
            timeout: 5000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    printWarning: (text) => {
        console.log(text);

        let options = {
            content: "<strong>Warning:<//strong> " + text,
            style: "alert-warning",
            timeout: 5000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    printInfo: (text) => {
        console.log(text);

        let options = {
            content: "<strong>Information:<//strong> " + text,
            style: "alert-info",
            timeout: 5000,
            htmlAllowed: true
        };

        $.snackbar(options).snackbar("show");
    },
    create: () => {
        let status = ko.observable(false);
        list.push(status);
        return status;
    },
    destroy: (status) => {
        list.remove(status);
    }
};

ko.computed(() => {
    let loading = list().filter((status) => status()).length > 0;

    if (loading) {
        mprogress.start();
    } else {
        mprogress.end();
    }
});
