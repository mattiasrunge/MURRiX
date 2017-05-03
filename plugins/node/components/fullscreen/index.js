
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const ui = require("lib/ui");
const loc = require("lib/location");

class NodeFullscreen extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.sidebarView = ko.pureComputed(() => ko.unwrap(loc.current().sidebar) || "main");
        model.showPath = ko.pureComputed(() => ko.unwrap(loc.current().showPath));
        model.personPath = ko.observable(false);
        model.selectedTag = ko.observable(false);
        model.height = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return 0;
            }

            if (model.nodepath().node().attributes.type === "image") {
                let screenHeight = ko.unwrap(ui.windowSize()).height;
                let heights = [ 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000 ];

                for (let height of heights) {
                    if (screenHeight < height) {
                        return height;
                    }
                }

                return heights[heights.length - 1];
            } else if (model.nodepath().node().attributes.type === "video") {
                return model.nodepath().node().attributes.fileinfo.height;
            }

            return 0;
        });

        model.nodepath = ko.nodepath(model.showPath);

        model.locationPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/location" : false);
        model.location = ko.nodepath(model.locationPath, { noerror: true });

        model.versionsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/versions" : false);
        model.versions = ko.nodepathList(model.versionsPath, { noerror: true });

        model.tagsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/tags" : false);
        model.tags = ko.nodepathList(model.tagsPath, { noerror: true });

        model.initialCameraName = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return "";
            }

            if (model.nodepath().node().attributes.deviceinfo) {
                return model.nodepath().node().attributes.deviceinfo.model || "";
            }

            return "";
        });

        model.filename = ko.asyncComputed(false, async (setter) => {
            if (!model.nodepath()) {
                return false;
            }

            setter(false);

            let height = ko.unwrap(model.height);
            let filename = false;

            model.loading(true);

            if (model.nodepath().node().attributes.type === "image") {
                filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
                    height: height,
                    type: "image"
                });
            } else if (model.nodepath().node().attributes.type === "video") {
                filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
                    height: height,
                    type: "video"
                });
            } else if (model.nodepath().node().attributes.type === "audio") {
                filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
                    type: "audio"
                });
            } else if (model.nodepath().node().attributes.type === "document") {
                filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
                    type: "document"
                });
            }

            console.log("filename", filename);

            model.loading(false);

            return filename ? filename : false;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return false;
        });

        model.tagNames = ko.pureComputed(() => {
            return model.tags()
            .map((tag) => tag.node().attributes.name)
            .join("<br>");
        });

        model.position = ko.pureComputed({
            read: () => {
                if (!model.nodepath()) {
                    return false;
                }

                if (model.nodepath().node().attributes.where) {
                    if (model.nodepath().node().attributes.where.gps) {
                        return model.nodepath().node().attributes.where.gps;
                    } else if (model.nodepath().node().attributes.where.manual) {
                        return model.nodepath().node().attributes.where.manual;
                    }
                }

                return false;
            },
            write: (position) => {
                let where = model.nodepath().node().attributes.where;

                where.manual = position;

                api.vfs.setattributes(model.nodepath().path, { where: where })
                .then((node) => {
                    model.nodepath().node(node);
                })
                .catch((error) => {
                    stat.printError(error);
                });
            }
        });

        model.selectTag = ko.pureComputed({
            read: () => {
                if (!model.selectedTag()) {
                    return false;
                }

                if (!model.selectedTag().link.attributes.y ||
                    !model.selectedTag().link.attributes.x ||
                    !model.selectedTag().link.attributes.width ||
                    !model.selectedTag().link.attributes.height) {
                    return {
                        x: false,
                        y: false,
                        width: false,
                        height: false
                    };
                }

                return {
                    x: model.selectedTag().link.attributes.x,
                    y: model.selectedTag().link.attributes.y,
                    width: model.selectedTag().link.attributes.width,
                    height: model.selectedTag().link.attributes.height
                };
            },
            write: (value) => {
                let attributes;

                if (!model.selectedTag().link.attributes.x && !value) {
                    return;
                } else if (!value) {
                    attributes = {
                        x: null,
                        y: null,
                        width: null,
                        height: null
                    };
                } else if (model.selectedTag().link.attributes.y !== value.y ||
                            model.selectedTag().link.attributes.x !== value.x ||
                            model.selectedTag().link.attributes.width !== value.width ||
                            model.selectedTag().link.attributes.height !== value.height) {
                    attributes = value;
                } else {
                    return;
                }

                api.vfs.lookup(model.selectedTag().link._id)
                .then((abspaths) => {
                    return api.vfs.setattributes(abspaths[0], attributes);
                })
                .then(() => {
                    model.selectedTag(false);
                })
                .catch((error) => {
                    stat.printError(error);
                });
            },
            owner: model
        });

        model.surroundings = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return false;
            }

            let index = this.props.list()
            .map((nodepath) => nodepath.path)
            .indexOf(model.nodepath().path);

            if (index === -1) {
                return false;
            }

            let result = {};

            if (index + 1 >= this.props.list().length) {
                result.next = this.props.list()[0];
            } else {
                result.next = this.props.list()[index + 1];
            }

            if (index - 1 < 0) {
                result.previous = this.props.list()[this.props.list().length - 1];
            } else {
                result.previous = this.props.list()[index - 1];
            }

            return result;
        });

        let surroundingsLoad = ko.computed(async () => {
            if (!model.surroundings()) {
                return;
            }

            let ids = [ model.surroundings().previous.node()._id, model.surroundings().next.node()._id ];
            let filenames = await api.file.getMediaUrl(ids, {
                height: ko.unwrap(model.height),
                type: "image"
            });

            for (let id of ids) {
                if (filenames[id]) {
                    (new Image()).src = filenames[id];
                }
            }
        });

        model.rotate = (offset) => {
            if (!model.nodepath().editable) {
                return;
            }

            offset = parseInt(offset, 10);

            if (model.nodepath().node().attributes.mirror) {
                offset = -offset;
            }

            let angle = parseInt(model.nodepath().node().attributes.angle || 0, 10) + offset;

            if (angle < 0) {
                angle += 360;
            } else if (angle > 270) {
                angle -= 360;
            }

            api.vfs.setattributes(model.nodepath().path, { angle: angle })
            .then((node) => {
                console.log("Saving angle attribute as " + angle + " successfully!", node);
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.mirror = () => {
            if (!model.nodepath().editable) {
                return;
            }

            let mirror = !model.nodepath().node().attributes.mirror;

            api.vfs.setattributes(model.nodepath().path, { mirror: mirror })
            .then((node) => {
                console.log("Saving mirror attribute as " + mirror + " successfully!", node);
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.exit = () => {
            if (model.sidebarView() === "time" || model.sidebarView() === "tag" || model.sidebarView() === "position") {
                model.sidebarView("main");
            } else {
                loc.goto({ showPath: null });
            }
        };

        model.removeTag = (tag) => {
            api.vfs.unlink(model.showPath() + "/tags/" + tag.name)
            .catch((error) => {
                stat.printError(error);
            });
        };

        let subscription = model.personPath.subscribe((value) => {
            if (!value) {
                return;
            }

            model.personPath(false);

            api.vfs.symlink(value, model.showPath() + "/tags")
            .catch((error) => {
                stat.printError(error);
            });
        });

        model.dispose = () => {
            model.nodepath.dispose();
            model.location.dispose();
            model.versions.dispose();
            model.tags.dispose();
            surroundingsLoad.dispose();
            subscription.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fullscreen animated zoomIn" data-bind="css: { showsidebar: sidebarView() !== 'hide' }, if: nodepath">
                <div className="sidebar" data-bind="visible: sidebarView() === 'main', if: sidebarView() === 'main'">
                    <h2 style={{ marginTop: "0" }}>
                        Information
                    </h2>

                    <table className="text-muted list">
                        <tbody>
                            <tr>
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="Description">description</i>
                                </td>
                                <td style={{ paddingTop: "1px" }}>
                                    <div data-bind="react: { name: 'node-widget-text-attribute', params: { nodepath: nodepath, name: 'description', html: true } }"></div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="Created by">person</i>
                                </td>

                                <td style={{ paddingTop: "1px" }}>
                                    <div data-bind="react: { name: 'node-widget-link-node', params: { nodepath: nodepath, name: 'createdBy', placeholder: 'Select who created model file', searchPaths: [ '/people' ] } }"></div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="Created with">camera</i>
                                </td>

                                <td style={{ paddingTop: "1px" }}>
                                    <div data-bind="react: { name: 'node-widget-link-node', params: { nodepath: nodepath, name: 'createdWith', placeholder: 'Select what camera was used', searchPaths: [ '/cameras' ], initial: initialCameraName } }"></div>
                                </td>
                            </tr>

                            <tr data-bind="visible: nodepath().node().attributes.fileinfo.width">
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="Resolution">photo_size_select_large</i>
                                </td>

                                <td style={{ paddingTop: "1px" }}>
                                    <span data-bind="text: nodepath().node().attributes.fileinfo.width"></span>x<span data-bind="text: nodepath().node().attributes.fileinfo.height"></span>
                                </td>
                            </tr>

                            <tr data-bind="visible: nodepath().node().attributes.fileinfo.duration">
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="Duration">timelapse</i>
                                </td>

                                <td style={{ paddingTop: "1px" }}>
                                    <span data-bind="duration: nodepath().node().attributes.fileinfo.duration"></span>
                                </td>
                            </tr>

                            <tr>
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="File">file_download</i>
                                </td>

                                <td style={{ paddingTop: "1px" }}>
                                    <a href="#" data-bind="text: nodepath().node().attributes.name, attr: { href: 'file/download/' + nodepath().node().attributes.diskfilename + '/' + nodepath().node().attributes.name }"></a>
                                    <span> (<span data-bind="htmlSize: nodepath().node().attributes.size"></span>)</span>
                                    <div data-bind="if: versions().length > 0">
                                        <small data-bind="foreach: versions" style={{ fontSize: "80%" }}>
                                            <a style={{ color: "#999" }} href="#" data-bind="text: $data.node().attributes.name, attr: { href: 'file/download/' + $data.node().attributes.diskfilename + '/' + $data.node().attributes.name }"></a>
                                            <span> (<span data-bind="htmlSize: $data.node().attributes.size"></span>)</span>
                                        </small>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div data-bind="text: JSON.stringify(nodepath().node().attributes.exif, null, 2)"></div>

                    <h3>Comments</h3>

                    <div data-bind="react: { name: 'comment-widget-comments', params: { path: showPath } }"></div>
                </div>

                <div className="sidebar" data-bind="visible: sidebarView() === 'tag', if: sidebarView() === 'tag'">
                    <h2 style={{ margin: "0" }}>
                        Tags
                    </h2>

                    <input type="text" className="form-control" style={{ marginTop: "15px" }} placeholder="Add a person" data-bind="nodeselect: { root: '/people', path: personPath }, visible: nodepath().editable, disable: selectedTag" />

                    <div data-bind="foreach: tags">
                        <div className="tag-item">
                            <div className="clearfix">
                                <div className="btn-group btn-group-sm float-right" role="group" data-bind="visible: $root.nodepath().editable">
                                    <button type="button" className="btn btn-primary" data-bind="click: $root.selectedTag.bind($data, $data), visible: !$root.selectedTag() && $root.nodepath().node().attributes.type === 'image'">Edit</button>
                                    <button type="button" className="btn btn-danger" data-bind="click: $root.removeTag.bind($data, $data), disable: $root.selectedTag">Remove</button>
                                </div>
                                <div data-bind="react: { name: 'file-widget-profile-picture', params: { size: 32, path: $data.path, nolazyload: true } }" className="float-left" style={{ marginRight: "15px" }} ></div>
                                <div className="title" data-bind="text: $data.node().attributes.name"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sidebar" data-bind="visible: sidebarView() === 'position', if: sidebarView() === 'position'">
                    <h2 style={{ margin: "0" }}>
                        Location
                    </h2>

                    <table className="text-muted list" style={{ marginTop: "30px" }}>
                        <tbody>
                            <tr>
                                <td style={{ width: "44px" }}>
                                    <i className="material-icons" title="Location">place</i>
                                </td>
                                <td style={{ paddingTop: "1px" }}>
                                    <div data-bind="react: { name: 'node-widget-link-node', params: { nodepath: nodepath, name: 'location', placeholder: 'Select location', searchPaths: [ '/locations' ], input: true } }"></div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ position: "absolute", top: "160px", left: "0", right: "0", bottom: "0" }} data-bind="map: { position: position, zoom: position() ? 15 : 10, editable: nodepath().editable }"></div>
                </div>

                <div className="sidebar" data-bind="visible: sidebarView() === 'time', if: sidebarView() === 'time'">
                    <h2 style={{ margin: "0" }}>
                        Set time
                    </h2>

                    <p className="text-muted" style={{ fontSize: "12px" }}>
                        Here it is possible to specifiy the time for when the content in model file was created, e.g. the time when a picture was taken. Dates can end after any part when the maximum know accuracy is reached. It is also possible to specify ranges when information is uncertain.
                    </p>
                    <p className="text-muted" style={{ fontSize: "12px" }}>
                        Some examples:
                    </p>
                    <table className="table table-condensed" style={{ fontSize: "10px" }}>
                        <tbody>
                            <tr>
                                <td>2002-03-04 13:45:03+01:00</td>
                                <td>Exact time</td>
                            </tr>
                            <tr>
                                <td>2002-03-04 13:45:03</td>
                                <td>Exact local time</td>
                            </tr>
                            <tr>
                                <td>2002-03-04 13</td>
                                <td>Exact date with hour</td>
                            </tr>
                            <tr>
                                <td>2002-03</td>
                                <td>Exact year and month</td>
                            </tr>
                            <tr>
                                <td>2002-03|04</td>
                                <td>Exact year but month range</td>
                            </tr>
                        </tbody>
                    </table>


                    <div data-bind="react: { name: 'node-widget-when-attribute', params: { nodepath: nodepath } }"></div>
                </div>

                <div className="maincontainer animated fadeIn" data-bind="if: filename">
                    <div data-bind="visible: nodepath().node().attributes.type === 'image', if: nodepath().node().attributes.type === 'image'">
                        <div data-bind="picture: { item: nodepath, filename: filename, tags: tags, height: $root.height, classes: 'resize-fit-center', nolazyload: true, selectTag: selectTag }" className="resize-fit-container"></div>
                    </div>
                    <div data-bind="visible: nodepath().node().attributes.type === 'video', if: nodepath().node().attributes.type === 'video'" className="resize-fit-container">
                        <video autoPlay controls preload="metadata" className="resize-fit-center">
                            <source src="" type="video/webm" data-bind="attr: { src: filename }" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div data-bind="visible: nodepath().node().attributes.type === 'audio', if: nodepath().node().attributes.type === 'audio'" style={{ position: "absolute", left: "0", right: "0", bottom: "0" }}>
                        <audio autoPlay controls preload="metadata" style={{ width: "100%" }}>
                            <source src="" type="video/webm" data-bind="attr: { src: filename }" />
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                    <div data-bind="visible: nodepath().node().attributes.type === 'document', if: nodepath().node().attributes.type === 'document'" style={{ position: "absolute", left: "0", right: "0", bottom: "0", top: "0" }}>
                        <iframe style={{ width: "100%", height: "100%", border: "none" }} src="" data-bind="attr: { src: filename }"></iframe>
                    </div>
                </div>

                <div className="bottombar">
                    <span data-bind="if: surroundings">
                        <a href="#" data-bind="location: { showPath: surroundings().previous.path, replace: true }">
                            <i className="material-icons md-48 float-left">arrow_back</i>
                        </a>
                    </span>

                    <span className="middle">
                        <span data-bind="location: { sidebar: 'time', replace: true }" style={{ cursor: "pointer" }}>
                            <i className="material-icons md-18">access_time</i>
                            <span> </span>
                            <span data-bind="displayTime: nodepath().node().attributes.time"></span>
                        </span>

                        <span data-bind="location: { sidebar: 'position', replace: true }" style={{ cursor: "pointer" }}>
                            <i className="material-icons md-18">place</i>
                            <span> </span>
                            <span data-bind="if: location">
                                <span data-bind="text: location().node().attributes.name"></span>
                            </span>
                            <span data-bind="if: !location()">
                                <span data-bind="positionAddress: position"></span>
                            </span>
                        </span>

                        <span data-bind="tooltip: tagNames, location: { sidebar: 'tag', replace: true }" style={{ cursor: "pointer" }}>
                            <i className="material-icons md-18">face</i>
                            <span> </span>
                            <span data-bind="text: tags().length"></span>
                        </span>
                    </span>

                    <span data-bind="if: surroundings">
                        <a href="#" data-bind="location: { showPath: surroundings().next.path, replace: true }">
                            <i className="material-icons md-48 float-right">arrow_forward</i>
                        </a>
                    </span>
                </div>

                <a href="#" className="information" data-bind="location: { sidebar: 'main', replace: true }, visible: sidebarView() === 'hide'">
                    <i className="material-icons">info</i>
                </a>

                <a href="#" className="hideinformation" data-bind="location: { sidebar: 'hide', replace: true }, visible: sidebarView() !== 'hide'">
                    <i className="material-icons">forward</i>
                </a>

                <div className="btn-group menu" data-bind="visible: nodepath().editable && sidebarView() === 'main'">
                    <a href="#" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i className="material-icons">more_vert</i>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-right">
                        <li><a href="#" data-bind="click: rotate.bind($data, 90)">
                            <i className="material-icons">rotate_left</i>
                            Rotate left
                        </a></li>
                        <li><a href="#" data-bind="click: rotate.bind($data, -90)">
                            <i className="material-icons">rotate_right</i>
                            Rotate right
                        </a></li>
                        <li><a href="#" data-bind="click: mirror">
                            <i className="material-icons">flip</i>
                            Mirror
                        </a></li>
                        <li role="separator" className="divider"></li>
                        <li><a href="#" data-bind="location: { sidebar: 'tag', replace: true }">
                            <i className="material-icons">face</i>
                            Tag people
                        </a></li>
                        <li><a href="#" data-bind="location: { sidebar: 'position', replace: true }">
                            <i className="material-icons">place</i>
                            Set location
                        </a></li>
                        <li><a href="#" data-bind="location: { sidebar: 'time', replace: true }">
                            <i className="material-icons">access_time</i>
                            Set time
                        </a></li>
                    </ul>
                </div>

                <a href="#" className="exit" data-bind="visible: sidebarView() === 'main', location: { sidebar: null, showPath: null, replace: true }">
                    <i className="material-icons">close</i>
                </a>
                <a href="#" className="exit" data-bind="visible: sidebarView() !== 'main', location: { sidebar: null, replace: true }">
                    <i className="material-icons">close</i>
                </a>
            </div>

        );
    }
}

export default NodeFullscreen;
