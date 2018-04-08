"use strict";

const api = require("api.io-client");

module.exports = {
    sortNodeList: (list) => {
        list.sort((a, b) => {
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
    // upload: (url, file, progressCallback) => {
    //     return new Promise((resolve, reject) => {
    //         let form = new FormData();
    //         form.append("file", file);
    //
    //         let startTime = Math.floor(Date.now() / 1000);
    //
    //         /* TODO: When fetch supports progress events switch to it
    //         fetch(url, {
    //             method: "POST",
    //             credentials: "include",
    //             body: form
    //         }).then((response) => {
    //             console.log('Status', response, response.json());
    //         }).catch((error) => {
    //             console.log('Error',error);
    //         });*/
    //
    //         console.log("Starting post of file", file);
    //
    //         $.ajax({
    //             url: url,
    //             type: "POST",
    //             data: form,
    //             cache: false,
    //             contentType: false,
    //             processData: false,
    //             timeout: 0,
    //             xhr: () => {
    //                 let xhr = $.ajaxSettings.xhr();
    //
    //                 let progressListener = (event) => {
    //                     let duration = Math.floor(Date.now() / 1000) - startTime;
    //
    //                     if (event.total === 0) {
    //                         return progressCallback(100, 0, duration);
    //                     }
    //
    //                     let progress = Math.min(Math.round((event.loaded / event.total) * 100), 100);
    //                     let speed = event.loaded / (duration === 0 ? 1 : duration);
    //
    //                     progressCallback(progress, speed, duration);
    //                 };
    //
    //                 xhr.upload.addEventListener("progress", progressListener, false);
    //                 xhr.addEventListener("progress", progressListener, false);
    //
    //                 return xhr;
    //             },
    //             success: function(data) {
    //                 console.error("Upload success", file);
    //                 resolve(data);
    //             },
    //             error: function(data) {
    //                 console.error("Upload failed, reason: " + data.responseText, file);
    //                 reject("Upload failed, reason: " + data.responseText);
    //             }
    //         }, "json");
    //     });
    // },
    modeString: (mode, options) => {
        let modeStr = "";

        let owner = true;
        let group = true;
        let other = true;
        let acl = false;

        if (options) {
            owner = options.owner;
            group = options.group;
            other = options.other;
            acl = options.acl;
        }

        if (acl) {
            modeStr += mode & api.vfs.MASK_ACL_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_ACL_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_ACL_EXEC ? "x" : "-";
        }

        if (owner) {
            modeStr += mode & api.vfs.MASK_OWNER_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_OWNER_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_OWNER_EXEC ? "x" : "-";
        }

        if (group) {
            modeStr += mode & api.vfs.MASK_GROUP_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_GROUP_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_GROUP_EXEC ? "x" : "-";
        }

        if (other) {
            modeStr += mode & api.vfs.MASK_OTHER_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_OTHER_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_OTHER_EXEC ? "x" : "-";
        }

        return modeStr;
    }
};
