"use strict";

const { Node } = require("../../vfs");

class Text extends Node {}

Text.IDENTIFIER = "t";

module.exports = Text;
