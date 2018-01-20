"use strict";

const { Node } = require("../../vfs");

class Person extends Node {}

Person.IDENTIFIER = "p";
Person.VERSION = 1;

module.exports = Person;
