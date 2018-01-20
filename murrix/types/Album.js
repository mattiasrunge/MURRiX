"use strict";

const { Node } = require("../../vfs");

class Album extends Node {}

Album.IDENTIFIER = "a";
Album.VERSION = 1;

module.exports = Album;
