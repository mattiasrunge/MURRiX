
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");

class NodeWidgetCard extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));


        return model;
    }

    getTemplate() {
        return (
            <a className="node-item-panel" style={{ width: "305px" }} data-bind="location: { page: 'node', path: nodepath().path, section: null }">
                <div style={{ position: "relative", height: "303px" }}>
                    <div data-bind="react: { name: 'file-widget-profile-picture', params: { size: 303, path: nodepath().path } }"></div>

                    <div className="title-text">
                        <i className="material-icons md-18" data-bind="visible: nodepath().node().properties.type === 'a'">photo_album</i>
                        <i className="material-icons md-18" data-bind="visible: nodepath().node().properties.type === 'p'">person</i>
                        <i className="material-icons md-18" data-bind="visible: nodepath().node().properties.type === 'l'">location_on</i>
                        <i className="material-icons md-18" data-bind="visible: nodepath().node().properties.type === 'c'">photo_camera</i>
                        <span> </span>
                        <span data-bind="text: nodepath().node().attributes.fullname ? nodepath().node().attributes.fullname :  nodepath().node().attributes.name"></span>
                    </div>
                </div>
                <div style={{ padding: "15px" }}>
                    <div data-bind="react: { name: 'node-widget-description', params: { nodepath: nodepath } }"></div>
                    <div data-bind="react: { name: 'node-widget-labels', params: { nodepath: nodepath } }"></div>
                </div>
            </a>

        );
    }
}

export default NodeWidgetCard;
