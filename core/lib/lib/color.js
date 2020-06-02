"use strict";

const chalk = require("chalk");

// Don't use color autodetect... it checks stdout
// which we don't output to
module.exports = new chalk.Instance({ level: 3 });
