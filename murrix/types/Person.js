"use strict";

const { Node } = require("../../vfs");

class Person extends Node {}

Person.IDENTIFIER = "p";

module.exports = Person;
