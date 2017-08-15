
/* global window document */

const ko = require("knockout");
const $ = require("jquery");

module.exports = {
    lastString: false, // Last JSON version of current to compare with
    current: ko.observable({}), // Current parameters
    get: (param, defValue = "") => {
        return module.exports.current()[param] || defValue;
    },
    subscribe: (fn) => {
        return module.exports.current.subscribe(fn);
    },
    parseUrl: (str) => {
        if (typeof str !== "string") {
            return {};
        }

        str = str.trim().replace(/^\?/, "");

        if (!str) {
            return {};
        }

        if (str[0] === "#") {
            str = str.substr(1);
        }

        return str.trim().split("&").reduce((ret, param) => {
            const parts = param.replace(/\+/g, " ").split("=");
            ret[parts[0]] = parts[1] === undefined ? null : decodeURIComponent(parts[1]);

            return ret;
        }, {});
    },
    makeUrl: (obj) => {
        return "#" + (obj ? Object.keys(obj).map((key) => {
            return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
        }).join("&") : "");
    },
    constructUrl: (args, baseOnCurrent) => {
        const newArgs = baseOnCurrent ? JSON.parse(JSON.stringify(module.exports.current())) : {};

        for (const argName in args) {
            if (args.hasOwnProperty(argName)) {
                if (ko.unwrap(args[argName]) !== "" || ko.unwrap(args[argName]) !== null) {
                    newArgs[argName] = ko.unwrap(args[argName]);
                }

                if (newArgs[argName] === "" || newArgs[argName] === null) {
                    delete newArgs[argName];
                }
            }
        }

        return module.exports.makeUrl(newArgs);
    },
    goto: (url, keep = true, replace = false) => {
        if (typeof url !== "string") {
            url = module.exports.constructUrl(url, keep);
        } else if (url[0] !== "#" && !url.startsWith("http") && !url.startsWith("mailto")) {
            url = `#${url}`;
        }

        if (window.history) {
            if (replace) {
                window.history.replaceState({}, null, url);
            } else {
                window.history.pushState({}, null, url);
            }

            module.exports.updateCurrent();
        } else {
            document.location.hash = url;
        }
    },
    updateCurrent: () => {
        const args = module.exports.parseUrl(document.location.hash);
        const argsString = JSON.stringify(args);

        if (module.exports.lastString !== argsString) {
            module.exports.current(args);
            module.exports.lastString = argsString;
        }
    },
    reload: () => {
        document.location.reload();
    }
};

$(window).on("hashchange", module.exports.updateCurrent);
module.exports.updateCurrent();
