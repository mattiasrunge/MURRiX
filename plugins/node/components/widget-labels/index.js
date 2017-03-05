
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");

class NodeWidgetLabels extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.editing = ko.observable(false);
        model.labelString = ko.observable("");

        model.edit = () => {
            model.labelString(model.nodepath().node().attributes.labels.join(" "));
            model.editing(true);
        };

        model.save = () => {
            let labels = model.labelString().trim();
            let oldLabels = model.nodepath().node().attributes.labels.join(" ");

            model.editing(false);

            if (labels !== oldLabels) {
                console.log("Saving attribute labels, old value was \"" + oldLabels + "\", new value is \"" + labels + "\"");

                let attributes = {};

                attributes.labels = labels.split(" ");

                api.vfs.setattributes(model.nodepath().path, attributes)
                .then((node) => {
                    model.nodepath().node(node);
                    console.log("Saving attribute labels successfull!", node);
                })
                .catch((error) => {
                    stat.printError(error);
                });
            }
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="node-widget-labels">
                <div className="edit-hover-container" data-bind="visible: nodepath() && nodepath().node().attributes.labels.length > 0 && !editing(), if: nodepath">
                    <span data-bind="foreach: nodepath().node().attributes.labels">
                        <a href="#" className="badge badge-primary" data-bind="text: $data, location: { page: 'search', query: 'label:' + $data }" style={{ marginRight: "5px", marginBottom: "5px" }}></a>
                    </span>

                    <a className="edit-hover-link" href="#" title="Edit" data-bind="visible: nodepath().editable, click: edit">
                        <i className="material-icons">edit</i>
                    </a>
                </div>
                <div data-bind="visible: nodepath() && nodepath().node().attributes.labels.length === 0 && !editing(), if: nodepath">
                    <a style={{ fontStyle: "italic", color: "#999", cursor: "text" }} href="#" data-bind="visible: nodepath().editable, click: edit">Add labels</a>
                </div>
                <div data-bind="visible: editing, if: editing">
                    <input type="text" className="form-control" data-bind="textInput: labelString, event: { blur: save }, hasFocus: true" placeholder="Write a label name" />
                </div>
            </div>

        );
    }
}

export default NodeWidgetLabels;
