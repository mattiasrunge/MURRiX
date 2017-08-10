
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class PeoplePage extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.section = this.props.section;
        model.loading = stat.create();
        model.reload = ko.observable(false);

        model.createTitle = ko.observable("");
        model.createType = ko.observable("generic");
        model.createText = ko.observable("");
        model.createTime = ko.observable(false);
        model.createPersonPath = ko.observable(false);

        model.metrics = ko.asyncComputed([], async (setter) => {
            if (!model.nodepath() || model.nodepath() === "") {
                return {};
            }

            setter({});

            model.loading(true);
            let metrics = await api.people.getMetrics(model.nodepath().path);
            model.loading(false);

            console.log("metrics", metrics);

            return metrics;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return {};
        });

        model.createEvent = () => {
            console.log("type", model.createType());
            console.log("title", model.createTitle());
            console.log("time", model.createTime());
            console.log("person", model.createPersonPath());
            console.log("text", model.createText());

            let basepath = model.nodepath().path + "/texts";
            let abspath = "";
            let attributes = {
                type: model.createType(),
                name: model.createTitle().trim(),
                text: model.createText().trim(),
                when: {
                    manual: model.createTime()
                }
            };

            if (attributes.name === "") {
                stat.printError("Name can not be empty");
                return;
            }

            if (!attributes.when.manual) {
                throw new Error("An event must must have date/time set");
            }

            api.node.getUniqueName(basepath, attributes.name)
            .then((name) => {
                abspath = basepath + "/" + name;
                return api.text.mktext(abspath, attributes);
            })
            .then(() => {
                if (model.createPersonPath()) {
                    return api.vfs.link(abspath, model.createPersonPath() + "/texts");
                }
            })
            .then(() => {
                model.createType("generic");
                model.createTitle("");
                model.createTime(false);
                model.createPersonPath(false);
                model.createText("");

                $("#createPeopleEventModal").modal("hide");

                model.reload(!model.reload());

                stat.printSuccess(attributes.name + " successfully created!");
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div>
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
                                    <td><strong>Birth name</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'birthname' } }"></div>
                                    </td>
                                </tr>
                                <tr data-bind="visible: metrics().birthdate">
                                <td><strong>Date of birth</strong></td>
                                    <td data-bind="text: metrics().birthdate"></td>
                                </tr>
                                <tr data-bind="visible: metrics().deathdate">
                                    <td><strong>Date of death</strong></td>
                                    <td data-bind="text: metrics().deathdate"></td>
                                </tr>
                                <tr data-bind="visible: metrics().deathdate">
                                    <td><strong>Age at death</strong></td>
                                    <td data-bind="text: metrics().ageatdeath"></td>
                                </tr>
                                <tr data-bind="visible: metrics().birthdate">
                                    <td><strong>Age</strong></td>
                                    <td data-bind="text: metrics().age"></td>
                                </tr>
                                <tr>
                                    <td><strong>Gender</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-select-attribute', params: { nodepath: nodepath, name: 'gender', options: [
                                            {
                                                name: 'f',
                                                title: 'Female'
                                            },
                                            {
                                                name: 'm',
                                                title: 'Male'
                                            }
                                        ]} }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Partner</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'people-widget-partner', params: { nodepath: nodepath } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Mother</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'people-widget-parent', params: { nodepath: nodepath, gender: 'f' } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Father</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'people-widget-parent', params: { nodepath: nodepath, gender: 'm' } }"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Allergies</strong></td>
                                    <td>
                                        <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'allergies' } }"></div>
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
                            name: 'timeline',
                            icon: 'event',
                            title: 'Timeline',
                            react: 'people-section-timeline'
                        },
                        {
                            name: 'media',
                            icon: 'photo_library',
                            title: 'Media',
                            react: 'node-section-media'
                        },
                        {
                            name: 'contact',
                            icon: 'contact_mail',
                            title: 'Contact',
                            react: 'people-section-contact'
                        },
                        {
                            name: 'family',
                            icon: 'people',
                            title: 'Family',
                            react: 'people-section-family'
                        }
                    ],
                    params: {
                        nodepath: nodepath,
                        reload: reload
                    }
                } }" className="node-widget-sections"></div>

                <form data-bind="submit: createEvent, moveToBody: true">
                    <div className="modal" id="createPeopleEventModal" tabIndex="-1" role="dialog">
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Create new event
                                    </h5>
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select className="form-control" data-bind="value: createType">
                                            <option value="generic">Generic</option>
                                            <option value="birth">Birth</option>
                                            <option value="engagement">Engagement</option>
                                            <option value="marriage">Marriage</option>
                                            <option value="death">Death</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Title</label>
                                        <input type="text" className="form-control" placeholder="Write a name" data-bind="textInput: createTitle" />
                                    </div>
                                    <div className="form-group">
                                        <label>Date and time</label>
                                        <input type="text" className="form-control" data-bind="timeInput: createTime" />
                                    </div>
                                    <div className="form-group">
                                        <label>Other person connected to model event</label>
                                        <input type="text" className="form-control" placeholder="Select a person" data-bind="nodeselect: { root: '/people', path: createPersonPath }" />
                                    </div>
                                    <div className="form-group">
                                        <label>Text</label>
                                        <textarea rows="6" className="form-control" placeholder="Write a description" data-bind="textInput: createText"></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="submit" className="btn btn-primary">Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

        );
    }
}

export default PeoplePage;
