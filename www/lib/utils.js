"use strict";

const ko = require("knockout");

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
    }
};

document.addEventListener("copy", (e) => {
    if (clipBoardContent) {
        e.clipboardData.setData("text/plain", clipBoardContent);
        e.preventDefault();
        clipBoardContent = false;
    }
});
