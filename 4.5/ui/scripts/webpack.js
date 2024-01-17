"use strict";

const path = require("path");
const fs = require("fs");

const src = path.join(__dirname, "..", "webpack.config.js");
const dst = require.resolve("react-scripts/config/webpack.config.js");

fs.copyFileSync(src, dst);
