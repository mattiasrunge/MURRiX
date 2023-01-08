"use strict";

const path = require("path");
const escapeStringRegexp = require("escape-string-regexp");
const { api } = require("../../api");
const Generic = require("./Generic");

class Path extends Generic {
    static async completer(client, partial) {
        if (partial.includes("*")) {
            return [ [], partial ];
        }

        // Complete a / if we are in the root and have not written anything
        if (partial.length === 0 && client.getCurrentDirectory() === "/") {
            return [ [ "/" ], "" ];
        }

        // If we have a relative path
        if (!partial.startsWith("/")) {
            if (partial.length === 0) {
                // Make sure we add a / so the endsWith logic works below
                partial = path.join(client.getCurrentDirectory(), "/");
            } else {
                // Create an absolute partial
                partial = path.join(client.getCurrentDirectory(), partial);
            }
        }

        const dirname = partial.endsWith("/") ? partial : path.dirname(partial);
        const basename = partial.endsWith("/") ? "" : path.basename(partial);
        const nodes = await api.list(client, dirname, {
            pattern: `${escapeStringRegexp(basename)}.*`,
            patternFlags: "",
            nofollow: true
        });
        const names = nodes.map((node) => node.name);

        // Complete an ending / if we have only one match and have the full name already
        if (names.length === 1 && names[0] === basename) {
            return [ [ "/" ], "" ];
        }

        return [ names, partial.endsWith("/") ? dirname : basename ];
    }
}

module.exports = Path;
