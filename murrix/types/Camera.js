"use strict";

const { Node } = require("../../vfs");

class Camera extends Node {}

Camera.IDENTIFIER = "c";
Camera.VERSION = 1;

module.exports = Camera;
