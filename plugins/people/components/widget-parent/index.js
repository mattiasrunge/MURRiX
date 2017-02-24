
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class PeopleWidgetParent extends Knockout {
    async getModel() {
        const model = {};

        model.reloadFlag = ko.observable(false);
        model.personPath = ko.pureComputed({
            read: () => {
                return model.nodepath().path;
            },
            write: (path) => {
                if (!model.editing()) {
                    return;
                }

                model.editing(false);

                if (path === model.nodepath().path) {
                    return;
                }

                api.people.setParent(ko.unwrap(this.props.nodepath().path), path, this.props.gender)
                .then(() => {
                    model.reloadFlag(!model.reloadFlag());
                    console.log("Saving parent " + path + " successfull!");
                })
                .catch((error) => {
                    stat.printError(error);
                });
            }
        });

        model.editing = ko.observable(false);
        model.nodepath = ko.asyncComputed(false, async (setter) => {
            setter(false);

            model.reloadFlag();

            let nodepath = await api.people.getParent(ko.unwrap(this.props.nodepath().path), this.props.gender);

            if (!nodepath) {
                return false;
            }

            return { path: nodepath.path, node: ko.observable(nodepath.node), editable: ko.observable(nodepath.editable) };
        }, (error) => {
            stat.printError(error);
            return false;
        });

        model.editable = ko.pureComputed(() => {
            if (!this.props.nodepath()) {
                return false;
            }

            return ko.unwrap(this.props.nodepath().editable);
        });

        model.edit = () => {
            model.editing(true);
        };


        return model;
    }

    getTemplate() {
        return (
            <span>
                ﻿<span className="edit-hover-container" data-bind="visible: nodepath() && !editing(), if: nodepath">
                    <a href="#" data-bind="location: { page: 'node', path: nodepath().path }, text: nodepath().node().attributes.name"></a>
                    <a className="edit-hover-link" href="#" title="Edit" data-bind="visible: editable, click: edit">
                        <i className="material-icons">edit</i>
                    </a>
                </span>
                <span data-bind="visible: !nodepath() && editable() && !editing()">
                    <i data-bind="click: edit" style={{ color: "#999" }}>Add parent</i>
                </span>
                <span data-bind="visible: !nodepath() && !editable() && !editing()">
                    <i style={{ color: "#999" }}>No parent set</i>
                </span>
                <span data-bind="visible: editing">
                    <input type="text" className="node-select-text" placeholder="Select a person" data-bind="nodeselect: { root: '/people', path: personPath }" />
                </span>
            </span>

        );
    }
}

export default PeopleWidgetParent;
