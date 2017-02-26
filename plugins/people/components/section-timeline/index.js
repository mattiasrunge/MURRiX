
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

        model.texts = ko.asyncComputed([], async (setter) => {
            if (!model.nodepath() || model.nodepath() === "") {
                return [];
            }

            this.props.reload();

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

            this.props.reload();

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
            </div>

        );
    }
}

export default PeopleSectionTimeline;
