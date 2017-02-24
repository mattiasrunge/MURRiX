
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");

class NodeWidgetSelectAttribute extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.onlyicon = ko.pureComputed(() => ko.unwrap(this.props.onlyicon));
        model.name = ko.pureComputed(() => ko.unwrap(this.props.name));
        model.nicename = ko.pureComputed(() => model.name().replace(/([A-Z])/g, " $1").toLowerCase());
        model.options = this.props.options;
        model.value = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return "";
            }

            return model.nodepath().node().attributes[model.name()] || "";
        });
        model.nicevalue = ko.pureComputed(() => {
            for (let option of ko.unwrap(model.options)) {
                if (option.name === model.value()) {
                    return option.title;
                }
            }

            return model.value();
        });
        model.icon = ko.pureComputed(() => {
            for (let option of ko.unwrap(model.options)) {
                if (option.name === model.value()) {
                    return option.icon;
                }
            }

            return false;
        });
        model.editable = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return false;
            }

            return ko.unwrap(model.nodepath().editable);
        });

        model.change = (value) => {
            if (!model.editable() || model.value() === value) {
                return;
            }

            console.log("Saving attribute " + model.name() + ", old value was \"" + model.value() + "\", new value is \"" + value + "\"");

            let attributes = {};

            attributes[model.name()] = value;

            api.vfs.setattributes(model.nodepath().path, attributes)
            .then((node) => {
                model.nodepath().node(node);
                console.log("Saving attribute " + model.name() + " successfull!", node);
            })
            .catch((error) => {
                stat.printError(error);
            });
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<span className="dropdown">
                <span data-toggle="dropdown" data-bind="css: { 'dropdown-toggle': editable }">
                    <i className="material-icons" style={{ marginRight: "-1px", marginBottom: "-1px" }} data-bind="visible: icon, text: icon"></i>
                    <span data-bind="visible: !onlyicon(), text: nicevalue"></span>
                </span>

                <span className="dropdown-select-empty" data-toggle="dropdown" data-bind="text: 'Select ' + nicename(), css: { 'dropdown-toggle': editable }, visible: value() === '' && editable()"></span>

                <span className="dropdown-select-empty" data-bind="text: 'No ' + nicename(), visible: value() === '' && !editable()"></span>

                <ul className="dropdown-menu" data-bind="foreach: options">
                    <li>
                        <a href="#" data-bind="click: $root.change.bind($data, $data.name)">
                            <i className="material-icons" data-bind="visible: $data.icon, text: $data.icon" style={{ marginRight: "10px" }}></i>
                            <span data-bind="text: $data.title"></span>
                        </a>
                    </li>
                </ul>
            </span>

        );
    }
}

export default NodeWidgetSelectAttribute;
