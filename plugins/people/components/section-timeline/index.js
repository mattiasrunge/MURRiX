
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const moment = require("moment");
const utils = require("lib/utils");
const stat = require("lib/status");

class PeopleSectionTimeline extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.loading = stat.create();
        model.reload = ko.observable(false);

        model.createTitle = ko.observable("");
        model.createType = ko.observable("generic");
        model.createText = ko.observable("");
        model.createTime = ko.observable(false);
        model.createPersonPath = ko.observable(false);

        model.texts = ko.asyncComputed([], async (setter) => {
            if (!model.nodepath() || model.nodepath() === "") {
                return [];
            }

            model.reload();

            setter([]);

            model.loading(true);

            let texts = await api.vfs.list(model.nodepath().path + "/texts", { checkwritable: true });

            utils.sortNodeList(texts);

            console.log("texts", texts);

            let list = [];

            for (let text of texts) {
                let paths = await api.vfs.lookup(text.node._id);
                let withPaths = paths.filter((path) => path !== text.path).map((path) => path.split("/", 3).join("/"));

                list.push(ko.observable({
                    path: text.path,
                    node: ko.observable(text.node),
                    editable: text.editable,
                    withPaths: withPaths
                }));
            }

            model.loading(false);

            return list;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        });

        model.events = ko.asyncComputed([], async (setter) => {
            if (!model.nodepath() || model.nodepath() === "") {
                return [];
            }

            model.reload();

            setter([]);

            model.loading(true);

            let texts = await api.vfs.list(model.nodepath().path + "/texts", { checkwritable: true });

            utils.sortNodeList(texts);

            console.log("texts", texts);

            let days = {};

            for (let text of texts) {
                let day = moment.utc(text.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD");

                let paths = await api.vfs.lookup(text.node._id);
                let withPaths = paths.filter((path) => path !== text.path).map((path) => path.split("/", 3).join("/"));

                days[day] = days[day] || { texts: [], day: text.node.attributes.time.timestamp };
                days[day].texts.push(ko.observable({
                    path: text.path,
                    node: ko.observable(text.node),
                    editable: text.editable,
                    withPaths: withPaths
                }));
            }

            days = Object.keys(days).map((key) => days[key]);

            days.sort((a, b) => {
                return a.day - b.day;
            });

            console.log("days", days);

            model.loading(false);

            return days;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        });

        model.createShow = () => {
            $("#createPeopleEventModal").modal("show");
        };

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

            api.vfs.uniqueName(basepath, attributes.name)
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
            ﻿<div style={{ position: "relative" }}>
                <a href="#" data-bind="click: createShow" style={{ position: "absolute", right: "20px", top: "20px", zIndex: "5" }}>
                    <i className="material-icons md-48">add_circle</i>
                </a>

                <table>
                    <tbody data-bind="foreach: texts">
                        <tr>
                            <td style={{ padding: "50px", borderRight: "1px solid #ccc", backgroundColor: "#EFEFEF", width: "250px", verticalAlign: "top", textAlign: "right", paddingBottom: "0", paddingLeft: "0", fontWeight: "bold" }} className="text-muted" data-bind="displayTimeline: $data.node().attributes.time"></td>
                            <td style={{ padding: "50px", verticalAlign: "top", position: "relative", paddingBottom: "0" }}>
                                <div style={{ position: "absolute", top: "45px", left: "-25px", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "50%", padding: "10px", color: "#777" }}><span data-bind="react: { name: 'node-widget-select-attribute', params: { nodepath: $parent.texts()[$index()], name: 'type', onlyicon: true, options: [
                                        {
                                            name: 'generic',
                                            icon: 'event',
                                            title: 'Generic'
                                        },
                                        {
                                            name: 'birth',
                                            icon: 'child_friendly',
                                            title: 'Birth'
                                        },
                                        {
                                            name: 'engagement',
                                            icon: 'favorite_border',
                                            title: 'Engagement'
                                        },
                                        {
                                            name: 'marriage',
                                            icon: 'favorite',
                                            title: 'Marriage'
                                        },
                                        {
                                            name: 'death',
                                            icon: 'sentiment_dissatisfied',
                                            title: 'Death'
                                        }
                                    ]} }"></span></div>
                                <h4 style={{ marginTop: "6px" }}>
                                    <span data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: $parent.texts()[$index()], name: 'name' } }" style={{ display: "inline" }}></span>
                                </h4>
                                <p className="text-muted" data-bind="visible: $data.withPaths.length > 0, if: $data.withPaths.length > 0" style={{ paddingBottom: "0", marginTop: "-10px", fontSize: "12px" }}>
                                    <em>
                                        <span>- with </span>
                                        <span data-bind="foreach: $data.withPaths">
                                            <a href="#" data-bind="location: { page: 'node', path: $data }, nodename: $data"></a>
                                        </span>
                                    </em>
                                </p>
                                <p>
                                    <span data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: $parent.texts()[$index()], name: 'text', html: true } }"></span>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <td style={{ padding: "50px", borderRight: "1px solid #ccc", backgroundColor: "#EFEFEF", width: "250px", verticalAlign: "top", textAlign: "right", paddingBottom: "0", paddingLeft: "0", fontWeight: "bold" }} className="text-muted"></td>
                            <td style={{ padding: "50px", verticalAlign: "top", position: "relative", paddingBottom: "0" }}></td>
                        </tr>
                    </tbody>
                </table>
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

export default PeopleSectionTimeline;
