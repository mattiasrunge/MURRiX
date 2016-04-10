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
    co: co.wrap,
    modeString: (mode) => {
        let modeStr = "";

        modeStr += mode & parseInt("400", 8) ? "r" : "-";
        modeStr += mode & parseInt("200", 8) ? "w" : "-";
        modeStr += mode & parseInt("100", 8) ? "x" : "-";
        modeStr += mode & parseInt("040", 8) ? "r" : "-";
        modeStr += mode & parseInt("020", 8) ? "w" : "-";
        modeStr += mode & parseInt("010", 8) ? "x" : "-";
        modeStr += mode & parseInt("004", 8) ? "r" : "-";
        modeStr += mode & parseInt("002", 8) ? "w" : "-";
        modeStr += mode & parseInt("001", 8) ? "x" : "-";

        return modeStr;
    }
};

document.addEventListener("copy", (e) => {
    if (clipBoardContent) {
        e.clipboardData.setData("text/plain", clipBoardContent);
        e.preventDefault();
        clipBoardContent = false;
    }
});
