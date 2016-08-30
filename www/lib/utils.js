"use strict";

const ko = require("knockout");
const co = require("co");
const $ = require("jquery");
const api = require("api.io-client");

let clipBoardContent = false;

ko.asyncComputed = function(defaultValue, fn, onError, extend) {
    let self = {};
    let promise = co.wrap(fn.bind(self));
    let reloadFlag = ko.observable(false);
    let result = ko.observable(defaultValue);
    let active = 0;
    let computed = ko.pureComputed(() => {
        let currentActive = ++active;
        reloadFlag();

        promise((value) => {
            return result(value);
        })
        .then((data) => {
            if (currentActive !== active) {
                return;
            }

            delete self.triggeredByReload;

            if (typeof data !== "undefined") {
                result(data);
            }
        })
        .catch((error) => {
            if (currentActive !== active) {
                return;
            }

            delete self.triggeredByReload;

            if (onError) {
                let ret = onError(error, result);

                if (typeof ret !== "undefined") {
                    result(ret);
                }
            } else {
                result(defaultValue);
            }
        });
    });

    if (extend) {
        computed.extend(extend);
    }

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.reload = () => {
        self.triggeredByReload = true;
        reloadFlag(!reloadFlag());
    };

    return pure;
};


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
            if (!a.node.attributes.time) {
                return -1;
            } else if (!b.node.attributes.time) {
                return 1;
            }

            return a.node.attributes.time.timestamp - b.node.attributes.time.timestamp;
        });
    },
    seconds: () => {
        return Math.floor(new Date().getTime() / 1000);
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
                        let progress = Math.min(Math.round((event.loaded / event.total) * 100), 100);
                        let duration = module.exports.seconds() - startTime;
                        let speed = event.total / (duration === 0 ? 1 : duration);

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
