"use strict";

const Node = require("../Node");

class Comment extends Node {}

Comment.IDENTIFIER = "k";
Comment.VERSION = 1;

module.exports = Comment;
