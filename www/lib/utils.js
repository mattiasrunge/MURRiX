"use strict";

const ko = require("knockout");
const co = require("co");

let clipBoardContent = false;

module.exports = {
    registerComponents: (list) => {
        for (let name of list) {
            ko.components.register(name, {
                viewModel: { require: "components/" + name + "/model" },
                template: { require: "text!components/" + name + "/template.html" }
            });
        }
    },
    copyToClipboard: (content) => {
        clipBoardContent = content;
        document.execCommand("copy");
    },
    wrapComponent: (fn) => {
        if (fn.constructor.name === "GeneratorFunction") {
            return function(params) {
                co.wrap(fn.bind(this))(params)
                .catch((error) => {
                    console.error(error.stack);
                });
            };
        }

        return fn;
    },
    co: co.wrap
};

document.addEventListener("copy", (e) => {
    if (clipBoardContent) {
        e.clipboardData.setData("text/plain", clipBoardContent);
        e.preventDefault();
        clipBoardContent = false;
    }
});
