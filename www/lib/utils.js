"use strict";

const ko = require("knockout");
const co = require("co");
const $ = require("jquery");
const api = require("api.io-client");

let clipBoardContent = false;


module.exports = {
    registerComponents: (list) => {
        for (let name of list) {
            ko.components.register(name, {
                viewModel: {
                    require: "components/" + name + "/model"
                },
                template: {
                    element: document.querySelector("link[rel=\"import\"]").import.querySelector("#" + name)
                }
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

        modeStr += mode & api.vfs.MASK_OWNER_READ ? "r" : "-";
        modeStr += mode & api.vfs.MASK_OWNER_WRITE ? "w" : "-";
        modeStr += mode & api.vfs.MASK_OWNER_EXEC ? "x" : "-";
        modeStr += mode & api.vfs.MASK_GROUP_READ ? "r" : "-";
        modeStr += mode & api.vfs.MASK_GROUP_WRITE ? "w" : "-";
        modeStr += mode & api.vfs.MASK_GROUP_EXEC ? "x" : "-";
        modeStr += mode & api.vfs.MASK_OTHER_READ ? "r" : "-";
        modeStr += mode & api.vfs.MASK_OTHER_WRITE ? "w" : "-";
        modeStr += mode & api.vfs.MASK_OTHER_EXEC ? "x" : "-";

        return modeStr;
    },
    sortNodeList: (list) => {
        list.sort((a, b) => {
            a = ko.unwrap(a.node);
            b = ko.unwrap(b.node);

            if (!a.attributes.time) {
                return a.attributes.name.localeCompare(b.attributes.name);
            } else if (!b.attributes.time) {
                return b.attributes.name.localeCompare(a.attributes.name);
            }

            return a.attributes.time.timestamp - b.attributes.time.timestamp;
        });
    },
    seconds: () => {
        return Math.floor(Date.now() / 1000);
    },
    upload: (url, file, progressCallback) => {
        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append("file", file);

            let startTime = module.exports.seconds();

            $.ajax({
                url: url,
                type: "POST",
                data: form,
                cache: false,
                contentType: false,
                processData: false,
                xhr: () => {
                    let xhr = $.ajaxSettings.xhr();

                    let progressListener = (event) => {
                        let duration = module.exports.seconds() - startTime;

                        if (event.total === 0) {
                            return progressCallback(100, 0, duration);
                        }

                        let progress = Math.min(Math.round((event.loaded / event.total) * 100), 100);
                        let speed = event.loaded / (duration === 0 ? 1 : duration);

                        progressCallback(progress, speed, duration);
                    };

                    xhr.upload.addEventListener("progress", progressListener, false);
                    xhr.addEventListener("progress", progressListener, false);

                    return xhr;
                },
                success: function(data) {
                    resolve(data);
                },
                error: function(data) {
                    console.error("Upload failed, reason: " + data.responseText, file);
                    reject("Upload failed, reason: " + data.responseText);
                }
            }, "json");
        });
    }
};

document.addEventListener("copy", (e) => {
    if (clipBoardContent) {
        e.clipboardData.setData("text/plain", clipBoardContent);
        e.preventDefault();
        clipBoardContent = false;
    }
});
