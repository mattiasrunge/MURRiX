"use strict";

const { Node } = require("../../vfs");

class Text extends Node {}

Text.IDENTIFIER = "t";
Text.VERSION = 1;

module.exports = Text;
