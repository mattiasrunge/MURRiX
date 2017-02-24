
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class LocationPage extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.section = this.props.section;

        model.position = ko.asyncComputed(false, async () => {
            if (!model.nodepath()) {
                return false;
            }

            if (!model.nodepath().node().attributes.address) {
                return false;
            }

            return await api.lookup.getPositionFromAddress(model.nodepath().node().attributes.address.replace("<br>", "\n"));
        }, (error) => {
            stat.printError(error);
            return false;
        });

        model.residentsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/residents" : false);
        model.residents = ko.nodepathList(model.residentsPath, { noerror: true });

        model.dispose = () => {
            model.residents.dispose();
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
                                    <td><strong>Address</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'address' } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Longitude</strong></td>
                                    <td data-bind="text: position().longitude"></td>
                                </tr>
                                <tr>
                                    <td><strong>Latitude</strong></td>
                                    <td data-bind="text: position().latitude"></td>
                                </tr>
                                <tr>
                                    <td><strong>Residents</strong></td>
                                    <td data-bind="foreach: residents">
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
                            name: 'map',
                            icon: 'location_on',
                            title: 'Map',
                            react: 'location-section-map'
                        },
                        {
                            name: 'media',
                            icon: 'photo_library',
                            title: 'Media',
                            react: 'location-section-media'
                        }
                    ],
                    params: {
                        nodepath: nodepath,
                        position: position
                    }
                } }" className="node-widget-sections"></div>
            </div>

        );
    }
}

export default LocationPage;
