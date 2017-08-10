
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const utils = require("lib/utils");

class CameraPage extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.section = this.props.section;

        model.ownersPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/owners" : false);
        model.owners = ko.nodepathList(model.ownersPath, { noerror: true });

        model.dispose = () => {
            model.owners.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated">
                <div className="row node-header" data-bind="if: nodepath" style={{ marginTop: "15px" }}>
                    <div className="col-md-8">
                         <div data-bind="react: { name: 'node-widget-header', params: { nodepath: nodepath } }"></div>
                    </div>
                    <div className="col-md-4 left-border">
                        <table className="table node-table text-muted">
                            <tbody>
                                <tr>
                                    <td><strong>Created</strong></td>
                                    <td data-bind="datetimeAgo: nodepath().node().properties.birthtime"></td>
                                </tr>
                                <tr>
                                    <td><strong>Last modified</strong></td>
                                    <td data-bind="datetimeAgo: nodepath().node().properties.mtime"></td>
                                </tr>
                                <tr>
                                    <td><strong>Type</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-select-attribute', params: { nodepath: nodepath, name: 'type', options: [
                                            {
                                                name: 'offset_fixed',
                                                title: 'Fixed offset'
                                            },
                                            {
                                                name: 'offset_relative_to_position',
                                                title: 'Offset relative to the position'
                                            }
                                        ]} }"></div>
                                    </td>
                                </tr>
                                <tr data-bind="visible: nodepath().node().attributes.type === 'offset_fixed'">
                                    <td><strong>Offset UTC</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'utcOffset' } }"></div>
                                    </td>
                                </tr>
                                <tr data-bind="visible: nodepath().node().attributes.type === 'offset_fixed'">
                                    <td><strong>Offset description</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'offsetDescription' } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Automatic daylight savings</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'deviceAutoDst' } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Serial number</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'serialNumber' } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Owners</strong></td>
                                    <td data-bind="foreach: owners">
                                        <div><a href="#" data-bind="location: { page: 'node', path: $data.path, section: null }, text: $data.node().attributes.name"></a></div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                 <div data-bind="react: { name: 'node-widget-sections', params: {
                     section: section,
                     sections: [
                         {
                             name: 'media',
                             icon: 'photo_library',
                             title: 'Media',
                             react: 'node-section-media'
                         }
                     ],
                     params: {
                         nodepath: nodepath
                     }
                 } }" className="node-widget-sections"></div>
            </div>

        );
    }
}

export default CameraPage;
