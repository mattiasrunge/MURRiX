"use strict";

const ko = require("knockout");
const $ = require("jquery");

module.exports = {
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
    basename: (path) => {
        return path.replace(/.*\//, "");
    },
    dirname: (path) => {
        return path.match(/(.*)[\/]/)[1];
    },
    upload: (url, file, progressCallback) => {
        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append("file", file);

            let startTime = Math.floor(Date.now() / 1000);

            /* TODO: When fetch supports progress events switch to it
            fetch(url, {
                method: "POST",
                credentials: "include",
                body: form
            }).then((response) => {
                console.log('Status', response, response.json());
            }).catch((error) => {
                console.log('Error',error);
            });*/

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
                        let duration = Math.floor(Date.now() / 1000) - startTime;

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
