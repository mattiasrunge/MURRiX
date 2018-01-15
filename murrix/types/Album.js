"use strict";

const { Node } = require("../../vfs");

class Album extends Node {}

Album.IDENTIFIER = "a";

module.exports = Album;
