
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");

class NodeWidgetType extends Knockout {
    async getModel() {
        const model = {};

        const types = {
            "a": "album",
            "l": "location",
            "p": "person",
            "c": "camera",
            "d": "directory",
            "f": "file",
            "s": "symlink",
            "k": "comment",
            "r": "root"
        };

        model.type = ko.pureComputed(() => types[ko.unwrap(this.props.type)] || "unknown");


        return model;
    }

    getTemplate() {
        return (
            ﻿<span data-bind="text: type"></span>
        );
    }
}

export default NodeWidgetType;
