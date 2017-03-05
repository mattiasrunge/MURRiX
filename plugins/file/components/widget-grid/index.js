
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");

class FileWidgetGrid extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.data = this.props.data;
        model.size = this.props.size;
        model.nodepath = this.props.nodepath;
        model.requestId = Date.now();
        model.progress = ko.observable(false);

        model.list = ko.asyncComputed([], async (setter) => {
            model.requestId = Date.now();
            let requestId = model.requestId;

            setter([]);

            console.log(model.data());

            let files = model.data().files;
            let texts = model.data().texts;
            let ids = files.map((file) => file.node()._id);

            model.progress({
                total: ids.length,
                complete: 0,
                progress: 0
            });

            model.loading(true);

            let filenames = await api.file.getMediaUrl(ids, {
                width: model.size,
                height: model.size,
                type: "image"
            }, model.requestId);

            if (model.requestId !== requestId) {
                return [];
            }

            model.loading(false);

            files = files.map((file) => {
                file.filename = filenames[file.node()._id] || false;
                return file;
            });

            utils.sortNodeList(files);

            session.list(files);

            utils.sortNodeList(texts);

            console.log("files", files);
            console.log("texts", texts);

            let days = {};

            for (let text of texts) {
                let day = text.node().attributes.time ? moment.utc(text.node().attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

                days[day] = days[day] || { texts: [], files: [], time: text.node().attributes.time };
                days[day].texts.push(text);
            }

            for (let file of files) {
                let day = file.node().attributes.time ? moment.utc(file.node().attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

                days[day] = days[day] || { texts: [], files: [], time: file.node().attributes.time };
                days[day].files.push(file);
            }

            days = Object.keys(days).map((key) => days[key]);

            days.sort((a, b) => {
                if (!a.time) {
                    return -1;
                } else if (!b.time) {
                    return 1;
                }

                return a.time.timestamp - b.time.timestamp;
            });

            console.log("days", days);

            return days;
        }, (error) => {
            model.progress(false);
            model.loading(false);
            stat.printError(error);
            return [];
        });

        let subscription = api.file.on("media-progress", (event) => {
            if (model.requestId !== event.requestId) {
                return;
            }

            model.progress({
                total: event.total,
                complete: event.complete,
                progress: Math.min((event.complete / event.total) * 100, 100)
            });
        });

        model.dispose = () => {
            api.file.off(subscription);
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="text-center" data-bind="visible: loading, if: loading">
                    <i className="material-icons md-48 spin">cached</i>
                    <div>
                        <strong>
                            <span>Generating </span>
                            <span data-bind="if: progress">
                                <span data-bind="text: progress().complete"></span>
                                <span> of </span>
                                <span data-bind="text: progress().total"></span>
                            </span>
                        </strong>
                    </div>
                    <div className="progress" style={{ marginTop: "5px", height: "5px", width: "200px", marginLeft: "auto", marginRight: "auto" }} data-bind="visible: progress, if: progress">
                        <div className="progress-bar" role="progressbar" data-bind="style: { width: progress().progress + '%' }"></div>
                    </div>
                </div>
                <div className="clearfix" data-bind="foreach: list">
                    <div style={{ marginLeft: "2px", marginRight: "2px" }}>
                        <div style={{ marginLeft: "13px", marginRight: "13px" }}>
                            <div data-bind="visible: $data.time, if: $data.time">
                                <h3 data-bind="displayTimeDay: $data.time"></h3>
                            </div>

                            <div data-bind="foreach: $data.texts">
                                <blockquote>
                                    <p data-bind="html: $data.node().attributes.text"></p>
                                    <footer>Written by <cite title="By" data-bind="unameNice: $data.node().properties.birthuid"></cite> on <span data-bind="datetimeUtc: $data.node().attributes.time.timestamp"></span></footer>
                                </blockquote>
                            </div>
                        </div>

                        <div className="clearfix" data-bind="foreach: $data.files, contextmenu: $root.nodepath" style={{ marginRight: "-1px", marginBottom: "-1px" }}><a href="#" className="context-menu float-left" data-bind="picture: { item: $data, width: $root.size, height: $root.size, classes: 'grid-picture', type: $data.node().attributes.type, title: $data.node().attributes.type !== 'image' && $data.node().attributes.type !== 'video' ? $data.node().attributes.name : false }, location: { showPath: $data.path }, attr: { title: $data.node().attributes.name, 'data-path': $data.path }"></a></div>
                    </div>
                </div>
            </div>

        );
    }
}

export default FileWidgetGrid;
