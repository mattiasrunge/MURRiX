"use strict";

const Node = require("../../../lib/Node");

class Comment extends Node {}

Comment.IDENTIFIER = "k";
Comment.VERSION = 1;

module.exports = Comment;
