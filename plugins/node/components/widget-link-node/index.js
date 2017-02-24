
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");

class NodeWidgetLinkNode extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.initial = ko.pureComputed(() => ko.unwrap(this.props.initial) || "");
        model.name = ko.pureComputed(() => ko.unwrap(this.props.name));
        model.placeholder = ko.pureComputed(() => ko.unwrap(this.props.placeholder));
        model.searchPaths = ko.pureComputed(() => ko.unwrap(this.props.searchPaths));
        model.editing = ko.observable(false);
        model.linkToPath = ko.observable(false);

        model.item = ko.asyncComputed(false, async (setter) => {
            let abspath = model.nodepath().path + "/" + model.name();

            setter(false);

            let link = await api.vfs.resolve(abspath, { noerror: true, nofollow: true });

            if (!link) {
                return false;
            }

            let item = await api.vfs.resolve(link.attributes.path);

            model.linkToPath(link.attributes.path);

            return { node: ko.observable(item), path: link.attributes.path };
        }, (error) => {
            stat.printError(error);
            return false;
        });

        let save = async (targetpath) => {
            if (model.item() && targetpath === model.item().path) {
                return;
            }

            let abspath = model.nodepath().path + "/" + model.name();

            await api.vfs.unlink(abspath);

            if (targetpath) {
                await api.vfs.symlink(targetpath, abspath);
            }

            model.item.reload();
        };

        let subscription = model.linkToPath.subscribe((value) => {
            if (!model.editing()) {
                return;
            }

            model.editing(false);

            save(value)
            .catch((error) => {
                stat.printError(error);
            });
        });

        model.dispose = () => {
            subscription.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <span>
                ﻿<span className="edit-hover-container" data-bind="visible: item() && !editing(), if: item">
                    <a href="#" data-bind="location: { page: 'node', path: item().path, showPath: null }, text: item().node().attributes.name"></a>
                    <a className="edit-hover-link" href="#" title="Edit" data-bind="visible: nodepath().editable, click: editing.bind($data, true)"><i className="material-icons">edit</i></a>
                </span>
                <span data-bind="visible: !item() && !editing()" style={{ color: "#999" }}>
                    <i data-bind="visible: nodepath().editable, click: editing.bind($data, true), text: placeholder"></i>
                    <i data-bind="visible: !nodepath().editable">Unknown</i>
                </span>
                <span data-bind="visible: editing, if: editing">
                    <input type="text" className="node-select-text" data-bind="attr: { placeholder: placeholder }, nodeselect: { root: searchPaths, path: linkToPath, initial: initial }, hasFocus: true" />
                </span>
            </span>

        );
    }
}

export default NodeWidgetLinkNode;
