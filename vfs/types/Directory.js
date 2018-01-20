"use strict";

const Node = require("../lib/Node");

class Directory extends Node {}

Directory.IDENTIFIER = "d";
Directory.VERSION = 1;

module.exports = Directory;
