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
    splitAt: (str, index) => {
        return [ str.slice(0, index), str.slice(index) ];
    },
    isNumber: (n) => {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    assert: (bool, message) => {
        if (!bool) {
            throw new Error(message);
        }
    },
    str2time: (str) => {
        const validate = (input, type) => {
            let data = input;
            let max = {
                year: 9999,
                month: 12,
                day: 31,
                hour: 23,
                minute: 59,
                second: 59,
                timezone: 59
            };
            let min = {
                year: "0000",
                month: "01",
                day: "00",
                hour: "00",
                minute: "00",
                second: "00",
                timezone: "00"
            };

            if (type === "timezone") {
                module.exports.assert(data.length === 6, type + " must be 6 letters and digits");
                let sign = data.substr(0, 1);
                let hours = data.substr(1, 2);
                let separator = data.substr(3, 1);
                let minutes = data.substr(4, 2);

                module.exports.assert(hours.length === 2, type + " must be 2 digits");
                module.exports.assert(module.exports.isNumber(hours), type + " hours must be a number");
                module.exports.assert(separator === ":", type + " separator must be a :");
                module.exports.assert(module.exports.isNumber(minutes), type + " minutes must be a number");
                module.exports.assert(parseInt(hours, 10) >= parseInt(min[type], 10), type + " hours must be larger or equal to " + min[type]);
                module.exports.assert(parseInt(minutes, 10) <= max[type], type + " minutes must be smallar or equal to " + max[type]);

                return data;
            }

            if (typeof input === "string") {
                data = [ input ];
            }

            let len = type === "year" ? 4 : 2;

            module.exports.assert(data[0].length === len, type + " must be " + len + " digits");
            module.exports.assert(module.exports.isNumber(data[0]), type + " must be a number");
            module.exports.assert(parseInt(data[0], 10) >= parseInt(min[type], 10), type + " must be larger or equal to " + min[type]);
            module.exports.assert(parseInt(data[0], 10) <= max[type], type + " must be smallar or equal to " + max[type]);

            if (data.length > 1) {
                module.exports.assert(data[1].length === len, type + " must be " + len + " digits");
                module.exports.assert(module.exports.isNumber(data[1]), type + " must be a number");
                module.exports.assert(parseInt(data[0], 10) < parseInt(data[1], 10), type + " range can not be negative");
                module.exports.assert(parseInt(data[1], 10) >= parseInt(min[type], 10), type + " must be larger or equal to " + min[type]);
                module.exports.assert(parseInt(data[1], 10) <= max[type], type + " must be smallar or equal to " + max[type]);
            }

            return input;
        };

        let result = {};
        let foundRange = false;

        if (str.length < 4) {
            return false;
        }

        // Year
        let parts = module.exports.splitAt(str, 4);
        result.year = validate(parts[0], "year");
        str = parts[1];

        if (str[0] === "|") {
            let parts = module.exports.splitAt(str.slice(1), 4);
            result.year = validate([ result.year, parts[0] ], "year");
            str = parts[1];
            foundRange = true;
        }

        if (str.length > 0 && !foundRange) {
            // Month
            if (str[0] === "-") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.month = validate(parts[0], "month");
                str = parts[1];
            } else {
                throw new Error("Expected a -");
            }

            if (str[0] === "|") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.month = validate([ result.month, parts[0] ], "month");
                str = parts[1];
                foundRange = true;
            }
        }

        if (str.length > 0 && !foundRange) {
            // Day
            if (str[0] === "-") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.day = validate(parts[0], "day");
                str = parts[1];
            } else {
                throw new Error("Expected a -");
            }

            if (str[0] === "|") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.day = validate([ result.day, parts[0] ], "day");
                str = parts[1];
                foundRange = true;
            }
        }

        if (str.length > 0 && !foundRange) {
            // Hour
            if (str[0] === " " || str[0] === "T") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.hour = validate(parts[0], "hour");
                str = parts[1];
            } else {
                throw new Error("Expected a space or T");
            }

            if (str[0] === "|") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.hour = validate([ result.hour, parts[0] ], "hour");
                str = parts[1];
                foundRange = true;
            }
        }

        if (str.length > 0 && !foundRange) {
            // Minute
            if (str[0] === ":") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.minute = validate(parts[0], "minute");
                str = parts[1];
            } else {
                throw new Error("Expected a :");
            }

            if (str[0] === "|") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.minute = validate([ result.minute, parts[0] ], "minute");
                str = parts[1];
                foundRange = true;
            }
        }

        if (str.length > 0 && !foundRange) {
            // Second
            if (str[0] === ":") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.second = validate(parts[0], "second");
                str = parts[1];
            } else {
                throw new Error("Expected a :");
            }

            if (str[0] === "|") {
                let parts = module.exports.splitAt(str.slice(1), 2);
                result.second = validate([ result.second, parts[0] ], "second");
                str = parts[1];
                foundRange = true;
            }
        }

        if (str.length > 0 && !foundRange) {
            // Second
            if (str[0] === "Z") {
                result.timezone = "+00:00"
                str = str.slice(1);
            } else if (str[0] === "-" || str[0] === "+") {
                let parts = module.exports.splitAt(str, 6);
                result.timezone = validate(parts[0], "timezone");
                str = parts[1];
            } else {
                throw new Error("Expected a - or +");
            }
        }

        if (str.length > 0 && foundRange) {
            throw new Error("Can not add more information after range");
        } else if (str.length > 0 && result.timezone) {
            throw new Error("Can not add more information after timezone");
        }

        return result;
    },
    time2str: (time) => {
        let str = "";

        if (time.year instanceof Array) {
            str += time.year[0] + "|" + time.year[1];
            return str;
        } else if (time.year) {
            str += time.year;
        } else {
            return str;
        }

        if (time.month instanceof Array) {
            str += "-" + time.month[0] + "|" + time.month[1];
            return str;
        } else if (time.month) {
            str += "-" + time.month;
        } else {
            return str;
        }

        if (time.day instanceof Array) {
            str += "-" + time.day[0] + "|" + time.day[1];
            return str;
        } else if (time.day) {
            str += "-" + time.day;
        } else {
            return str;
        }

        if (time.hour instanceof Array) {
            str += " " + time.hour[0] + "|" + time.hour[1];
            return str;
        } else if (time.hour) {
            str += " " + time.hour;
        } else {
            return str;
        }

        if (time.minute instanceof Array) {
            str += ":" + time.minute[0] + "|" + time.minute[1];
            return str;
        } else if (time.minute) {
            str += ":" + time.minute;
        } else {
            return str;
        }

        if (time.second instanceof Array) {
            str += ":" + time.second[0] + "|" + time.second[1];
            return str;
        } else if (time.second) {
            str += ":" + time.second;
        } else {
            return str;
        }

        if (time.timezone) {
            str += time.timezone;
        }

        return str;
    },
    sortNodeList: (list) => {
        list.sort((a, b) => {
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
