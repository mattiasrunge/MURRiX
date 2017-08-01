
import React from "react";
import Knockout from "components/knockout";

class NodeWidgetDescription extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;


        return model;
    }

    getTemplate() {
        return (
            ﻿<p className="node-widget-description">
                <span data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'description', html: true } }"></span>
            </p>

        );
    }
}

export default NodeWidgetDescription;
