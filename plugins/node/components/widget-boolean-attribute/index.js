
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");

class NodeWidgetBooleanAttribute extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.name = ko.pureComputed(() => ko.unwrap(this.props.name));
        model.nicename = ko.pureComputed(() => model.name().replace(/([A-Z])/g, " $1").toLowerCase());
        model.value = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return "";
            }

            return model.nodepath().node().attributes[model.name()];
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

        model.setYes = () => {
            model.change(true);
        };

        model.setNo = () => {
            model.change(false);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="dropdown">
                <span data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" data-bind="text: value() ? 'Yes' : 'No', css: { 'dropdown-toggle': editable }"></span>
                <ul className="dropdown-menu">
                    <li data-bind="visible: !value()">
                        <a href="#" data-bind="click: setYes">Change to Yes</a>
                    </li>
                    <li data-bind="visible: value">
                        <a href="#" data-bind="click: setNo">Change to No</a>
                    </li>
                </ul>
            </div>

        );
    }
}

export default NodeWidgetBooleanAttribute;
