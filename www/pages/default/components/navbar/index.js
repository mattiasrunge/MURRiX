
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

class DefaultNavbar extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.loading;
        model.user = session.user;
        model.searchPaths = session.searchPaths;
        model.stars = ko.observableArray();
        model.loggedIn = session.loggedIn;
        model.createType = ko.observable("");
        model.createName = ko.observable("");
        model.createDescription = ko.observable("");
        model.showCreateModal = ko.observable(false);
        model.pathError = ko.observable(false);
        model.pathPermissionDenied = ko.pureComputed(() => model.pathError() && model.pathError().toString().includes("Permission denied"));
        model.needLogin = ko.pureComputed(() => model.pathPermissionDenied() && !session.loggedIn());
        model.path = ko.pureComputed({
            read: () => loc.current().page === "node" ? loc.current().path : "",
            write: (path) => {
                if (path) {
                    return loc.goto({ page: "node", path: path }, false);
                }

                if (model.needLogin()) {
                    return loc.goto({ page: "login" });
                }

                loc.goto({}, false);
            }
        });
        model.starred = ko.pureComputed(() => model.stars().filter((star) => star.path === model.path()).length > 0);

        const loadStars = () => {
            api.auth.getStars()
            .then(model.stars)
            .catch((error) => {
                stat.printError(error);
            });
        };

        let subscription = session.user.subscribe(loadStars);
        loadStars();

        model.toggleStar = () => {
            api.auth.toggleStar(model.path())
            .then((result) => {
                model.stars(result.stars);

                if (result.created) {
                    stat.printSuccess("Star created");
                } else {
                    stat.printSuccess("Star removed");
                }
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.random = () => {
            api.vfs.random([ "/albums" ], 1)
            .then((item) => {
                if (item) {
                    loc.goto({ page: "node", path: item.path }, false);
                } else {
                    stat.printError("No random node could be found");
                }
            });
        };

        model.createShow = (type) => {
            model.createType(type);
            model.createName("");
            model.createDescription("");
            model.showCreateModal(true);
        };

        model.create = () => {
            console.log("type", model.createType());
            console.log("name", model.createName());
            console.log("description", model.createDescription());

            let promise;
            let abspath = "";
            let attributes = {
                name: model.createName().trim(),
                description: model.createDescription().trim()
            };

            if (attributes.name === "") {
                stat.printError("Name can not be empty");
                return;
            }

            if (model.createType() === "album") {
                promise = api.node.getUniqueName("/albums", attributes.name)
                .then((name) => {
                    abspath = "/albums/" + name;
                    return api.album.mkalbum(name, attributes);
                });
            } else if (model.createType() === "location") {
                promise = api.node.getUniqueName("/locations", attributes.name)
                .then((name) => {
                    abspath = "/locations/" + name;
                    return api.location.mklocation(name, attributes);
                });
            } else if (model.createType() === "person") {
                promise = api.node.getUniqueName("/people", attributes.name)
                .then((name) => {
                    abspath = "/people/" + name;
                    return api.people.mkperson(name, attributes);
                });
            } else if (model.createType() === "camera") {
                promise = api.node.getUniqueName("/cameras", attributes.name)
                .then((name) => {
                    abspath = "/cameras/" + name;
                    return api.camera.mkcamera(name, attributes);
                });
            } else {
                stat.printError("Unknown create type");
                return;
            }

            promise
            .then(() => {
                model.createType("");
                model.createName("");
                model.createDescription("");
                model.showCreateModal(false);

                loc.goto({ page: "node", path: abspath }, false);

                stat.printSuccess(attributes.name + " successfully created!");
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.dispose = () => {
            subscription.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="navbar navbar-fixed-top navbar-inverse navbar-background" role="navigation">
                    <div className="container">
                        <div className="navbar-header">
                            <a className="navbar-brand" href="#" data-bind="tooltip: 'Go to start'" data-placement="bottom" data-trigger="hover">
                                <i className="material-icons md-20">home</i>
                            </a>
                        </div>

                        <div className="navbar-form navbar-left collapse navbar-collapse">
                            <div className="form-group header-search">
                                <input type="text" className="form-control" placeholder="Search for anything" data-bind="nodeselect: { root: searchPaths, path: path, error: pathError }" style={{ width: "100%" }} />

                                <a className="star" href="#" data-bind=", attr: { title: starred() ? 'Click to unstar' : 'Click to star' }, click: toggleStar, visible: loggedIn() && path() !== '', tooltip: starred() ? 'Click to unstar' : 'Click to star'" data-placement="bottom" data-trigger="hover">
                                    <i className="material-icons md-24" data-bind="visible: starred">star</i>
                                    <i className="material-icons md-24" data-bind="visible: !starred()">star_border</i>
                                </a>
                            </div>
                        </div>

                        <div className="collapse navbar-collapse">
                            <ul className="nav navbar-nav navbar-right" data-bind="react: 'auth-widget-navbar-user'"></ul>

                            <ul className="nav navbar-nav navbar-right" data-bind="visible: user() !== false">
                                <li>
                                    <a href="#" data-bind="click: random, visible: loggedIn(), tooltip: 'Go to random'" data-placement="bottom" data-trigger="hover">
                                        <i className="material-icons md-20">explore</i>
                                    </a>
                                </li>
                                <li className="dropdown" data-bind="visible: stars().length > 0 && loggedIn()">
                                    <a className="dropdown-toggle" data-toggle="dropdown" href="#" data-bind="tooltip: 'Starred'" data-placement="bottom" data-trigger="hover">
                                        <i className="material-icons md-20">star</i>
                                    </a>
                                    <ul className="dropdown-menu" data-bind="foreach: stars">
                                        <li>
                                            <a href="#" data-bind="location: { page: 'node', path: $data.path, section: null }">
                                                <div style={{ display: "inline-block" }} data-bind="react: { name: 'file-widget-profile-picture', params: { size: 16, path: $data.path, nolazyload: true } }"></div>
                                                &nbsp;&nbsp;
                                                <span data-bind="nodename: $data.path"></span>
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                                <li className="dropdown" data-bind="visible: loggedIn">
                                    <a className="dropdown-toggle" title="Create" data-toggle="dropdown" href="#" data-bind="tooltip: 'Create'" data-placement="bottom" data-trigger="hover">
                                        <i className="material-icons md-20">add</i>
                                    </a>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <a href="#" data-bind="click: createShow.bind($data, 'album')">
                                                <i className="material-icons">photo_album</i>
                                                &nbsp;&nbsp;
                                                Album
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" data-bind="click: createShow.bind($data, 'person')">
                                                <i className="material-icons">person</i>
                                                &nbsp;&nbsp;
                                                Person
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" data-bind="click: createShow.bind($data, 'location')">
                                                <i className="material-icons">location_on</i>
                                                &nbsp;&nbsp;
                                                Location
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" data-bind="click: createShow.bind($data, 'camera')">
                                                <i className="material-icons">photo_camera</i>
                                                &nbsp;&nbsp;
                                                Camera
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <form data-bind="submit: create">
                    <div className="modal fade" id="createModal" tabIndex="-1" role="dialog" data-bind="modal: showCreateModal">
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                    <h4 className="modal-title">
                                        Create new <span data-bind="text: createType"></span>
                                    </h4>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input type="text" className="form-control" placeholder="Write a name" data-bind="textInput: createName" />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea rows="6" className="form-control" placeholder="Write a description" data-bind="textInput: createDescription"></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
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

export default DefaultNavbar;
