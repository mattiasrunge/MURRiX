
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const stat = require("lib/status");

class NodeSectionMove extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = this.props.nodepath;
        model.size = 226;

        model.filesPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/files" : false);
        model.files = ko.nodepathList(model.filesPath, { noerror: true });

        model.textsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/texts" : false);
        model.texts = ko.nodepathList(model.textsPath, { noerror: true });

        model.data = ko.pureComputed(() => {
            const files = model.files();
            const texts = model.texts();

            return {
                files: model.files.hasLoaded() ? files : [],
                texts: model.texts.hasLoaded() ? texts : []
            };
        });

        model.dispose = () => {
            model.files.dispose();
            model.texts.dispose();
            stat.destroy(model.loading);
        };

        model.editable = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return false;
            }

            return ko.unwrap(model.nodepath().editable);
        });

        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated node-content" style={{ position: "relative" }}>
                <div className="fluid-container">
                    <div className="row">
                        <div className="col-6">
                            <table className="table table-striped table-hover table-sm" style={{ width: "100%", marginBottom: "0" }}>
                                <tbody data-bind="foreach: data().files">
                                    <tr>
                                        <td>
                                            <span data-bind="picture: { item: $data, width: 16, height: 16, classes: 'move-picture' }"></span>
                                            <span data-bind="text: $data.name"></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="col-6">
                            1 of 2
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default NodeSectionMove;
