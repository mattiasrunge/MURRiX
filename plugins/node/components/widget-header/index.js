
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";



class NodeWidgetHeader extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;


        return model;
    }

    getTemplate() {
        return (
            ﻿<div style={{ display: "table" }}>
                <div style={{ display: "table-cell", padding: "0", verticalAlign: "top" }}>
                    <div data-bind="react: { name: 'file-widget-profile-picture', params: { size: 128, path: nodepath().path } }" className="pull-left" style={{ marginRight: "15px" }}></div>
                </div>
                <div style={{ display: "table-cell", padding: "0", verticalAlign: "top", width: "100%" }}>
                    <h2>
                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'name' } }"></div>
                    </h2>
                    <div data-bind="react: { name: 'node-widget-description', params: { nodepath: nodepath } }"></div>
                    <div data-bind="react: { name: 'node-widget-labels', params: { nodepath: nodepath } }"></div>
                </div>
            </div>

        );
    }
}

export default NodeWidgetHeader;
