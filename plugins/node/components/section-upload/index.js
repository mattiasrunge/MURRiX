
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const $ = require("jquery");
const utils = require("lib/utils");
const stat = require("lib/status");
const api = require("api.io-client");

class NodeSectionUpload extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.active = ko.observable(false);
        model.fileInput = ko.observableArray();
        model.extra = ko.observable(false);

        model.files = ko.asyncComputed([], async () => {
            let files = [];

            for (let file of model.fileInput()) {
                files.push({
                    uploadId: await api.vfs.allocateUploadId(),
                    progress: ko.observable(0),
                    size: file.size,
                    name: file.name,
                    active: ko.observable(false),
                    complete: ko.observable(false),
                    failed: ko.observable(false),
                    file: file
                });
            }

            return files;
        }, (error) => {
            stat.printError(error);
            return [];
        });

        model.dragNoopHandler = (element, event) => {
            event.stopPropagation();
            event.preventDefault();
        };

        model.dropEventHandler = async (element, event) => {
            event.stopPropagation();
            event.preventDefault();

            console.log("files", event.originalEvent.dataTransfer.files);

            model.fileInput(event.originalEvent.dataTransfer.files);
        };

        model.selectHandler = (id) => {
            $("#" + id).trigger("click");
        };

        model.editable = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return false;
            }

            return ko.unwrap(model.nodepath().editable);
        });

        model.finished = ko.pureComputed(() => {
            return model.files().filter((item) => item.complete()).length;
        });

        model.size = ko.pureComputed(() => {
            return model.files().reduce((pv, item) => pv + item.size, 0);
        });

        model.speed = ko.observable(0);

        model.progress = ko.pureComputed(() => {
            let progress = model.files().reduce((pv, item) => pv + item.progress(), 0);

            return Math.round(progress / (model.files().length || 1));
        });

        model.import = async (abspath, item) => {
            console.log("Importing " + item.name + " as " + abspath, item);

            let file = await api.file.mkfile(abspath, {
                name: item.name,
                _source: {
                    uploadId: item.uploadId
                }
            });

            item.active(false);
            item.complete(true);

            console.log(item.name + " imported as " + abspath, item, file);
        };

        model.start = async () => {
            model.active(true);

            let delayed = [];
            let parentPath = model.nodepath().path + "/" + (model.extra() ? "extra" : "files");

            // Pass 1: Check duplicate names
            // TODO

            // Pass 2: Upload all files and import non-raw
            for (let item of model.files()) {
                item.active(true);
                item.failed(false);

                let result = await utils.upload("/file/upload/" + item.uploadId, item.file, (progress, speed) => {
                    item.progress(progress);
                    model.speed(speed);
                });

                if (result.status !== "success") {
                    throw new Error("Status was not success but " + result.status + " for ", item);
                }

                console.log(result.metadata);

                if (result.metadata.rawImage && !model.extra()) {
                    delayed.push({
                        metadata: result.metadata,
                        item: item
                    });
                } else {
                    await api.vfs.ensure(parentPath, "d");

                    let name = await api.vfs.uniqueName(parentPath, item.name);
                    await model.import(parentPath + "/" + name, item);
                }
            }

            console.log("First run of files imported, " + delayed.length + " files delayed");

            let parent = await api.vfs.resolve(parentPath);
            let children = [];
            for (let child of parent.properties.children) {
                let name = child.name.substr(0, child.name.lastIndexOf(".")) || child.name;
                children[name] = child;
            }


            // Pass 3: Import delayed (raw) files
            for (let file of delayed) {
                let basename = file.item.name.substr(0, file.item.name.lastIndexOf(".")) || file.item.name;

                if (children[basename]) {
                    let versionPath = parentPath + "/" + children[basename].name + "/versions";

                    await api.vfs.ensure(versionPath, "d");

                    let name = await api.vfs.uniqueName(versionPath, file.item.name);

                    await model.import(versionPath + "/" + name, file.item);
                } else {
                    let name = await api.vfs.uniqueName(parentPath, file.item.name);
                    await model.import(parentPath + "/" + name, file.item);
                }
            }


            model.active(false);
            stat.printSuccess("Uploaded " + model.files().length + " files successfully!");
            model.fileInput([]);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated node-content" style={{ position: "relative" }} data-bind="event: { dragenter: dragNoopHandler, dragexit: dragNoopHandler, dragover: dragNoopHandler, drop: dropEventHandler }">
                <div style={{ position: "absolute", right: "0", top: "0", zIndex: "5" }} data-bind="visible: fileInput().length > 0">
                    <table style={{ display: "inline-block" }}>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: "bold", paddingRight: "5px" }}>
                                    Speed:
                                </td>
                                <td style={{ width: "80px" }}>
                                    <span data-bind="htmlSize: speed"></span>/s
                                </td>
                                <td style={{ fontWeight: "bold", paddingRight: "5px" }}>
                                    Progress:
                                </td>
                                <td style={{ width: "70px" }}>
                                    <span data-bind="text: progress"></span>%
                                </td>
                                <td style={{ fontWeight: "bold", paddingRight: "5px" }}>
                                    Files:
                                </td>
                                <td style={{ width: "70px" }}>
                                    <span data-bind="text: files().length"></span>
                                </td>
                                <td style={{ fontWeight: "bold", paddingRight: "5px" }}>
                                    Total size:
                                </td>
                                <td style={{ width: "80px" }}>
                                    <span data-bind="htmlSize: size"></span>
                                </td>
                                <td style={{ width: "60px" }}>
                                    <input type="checkbox" data-bind="checked: extra" /> Extra
                                </td>
                                <td>
                                    <button type="button" className="btn btn-primary" data-bind="click: start, disable: active">Upload</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>Upload files</h3>

                <div className="text-muted text-center" style={{ paddingTop: "100px", paddingBottom: "100px", fontSize: "20px", border: "2px dashed #ccc" }} data-bind="visible: files().length === 0">
                    <span>Drop files here or </span>
                    <button className="btn btn-lg btn-primary" id="id" data-bind="click: selectHandler.bind($data, 'file-select')">Select files</button>
                    <input id="file-select" type="file" multiple style={{ display: "none" }} data-bind="fileUpload: fileInput" />
                </div>
                <div data-bind="visible: files().length > 0">
                    <table className="table table-striped table-hover table-condensed" style={{ width: "100%", marginBottom: "0" }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th style={{ width: "100px" }}>Size</th>
                                <th style={{ width: "500px" }}>Progress</th>
                            </tr>
                        </thead>
                        <tbody data-bind="foreach: files">
                            <tr>
                                <td data-bind="text: $data.name"></td>
                                <td data-bind="htmlSize: $data.size"></td>
                                <td>
                                    <div className="progress" style={{ marginBottom: "0" }}>
                                        <div className="progress-bar progress-bar-striped" role="progressbar" data-bind="style: { width: $data.progress() + '%' }, css: { active: $data.active, 'progress-bar-success': $data.complete, 'progress-bar-danger': $data.failed }, text: $data.progress() + '%'"></div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
}

export default NodeSectionUpload;
