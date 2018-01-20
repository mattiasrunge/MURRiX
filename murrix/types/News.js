"use strict";

const { Node } = require("../../vfs");

class News extends Node {}

News.IDENTIFIER = "n";
News.VERSION = 1;

module.exports = News;
