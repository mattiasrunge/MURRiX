"use strict";

const { Node } = require("../../vfs");

class Location extends Node {}

Location.IDENTIFIER = "l";
Location.VERSION = 1;

module.exports = Location;
