
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const utils = require("lib/utils");

class AlbumPage extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.section = this.props.section;
        model.filesPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/files" : false);
        model.filesNodepath = ko.nodepath(model.filesPath, { noerror: true });
        model.count = ko.pureComputed(() => {
            if (!model.filesNodepath()) {
                return 0;
            }

            return model.filesNodepath().node().properties.children.length;
        });

        model.dispose = () => {
            model.filesNodepath.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="">
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
                                    <td><strong>Number of files</strong></td>
                                    <td data-bind="text: count"></td>
                                </tr>
                                {/*  <tr>
                                    <td><strong>Download files</strong></td>
                                    <td>
                                        <a href="#" data-bind="text: nodepath().node().attributes.name.replace(' ', '_') + '.zip'"></a> (size) <-- TODO
                                    </td>
                                </tr> */}
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
                            react: 'album-section-media'
                        }
                    ],
                    showShareSettings: nodepath().editable,
                    showUpload: nodepath().editable,
                    params: {
                        nodepath: nodepath
                    }
                } }" className="node-widget-sections"></div>
            </div>

        );
    }
}

export default AlbumPage;
