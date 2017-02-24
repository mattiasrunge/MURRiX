
import React from "react";
import Knockout from "components/knockout";



class NodeSectionComments extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated node-content">
                <h3>Comments</h3>
                <div data-bind="react: { name: 'comment-widget-comments', params: { path: nodepath().path } }"></div>
            </div>

        );
    }
}

export default NodeSectionComments;
