
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";



class PeopleSectionContact extends Knockout {
    async getModel() {
        const model = {};

        /* TODO:
         * Homes should have a date interval on them, store as attributes on the symlink
         * Contact information should have icons and emails be clickable etc
         */

        const ko = require("knockout");
        const api = require("api.io-client");
        const utils = require("lib/utils");
        const stat = require("lib/status");

        model.nodepath = this.props.nodepath;
        model.selectedHome = ko.observable(false);
        model.locationPath = ko.observable();

        model.position = ko.asyncComputed(false, async () => {
            if (!model.selectedHome()) {
                return false;
            }

            return await api.lookup.getPositionFromAddress(model.selectedHome().node.attributes.address.replace("<br>", "\n"));
        }, (error) => {
            stat.printError(error);
            return false;
        });

        model.homes = ko.asyncComputed(false, async () => {
            let list = await api.vfs.list(model.nodepath().path + "/homes");

            if (list.length > 0) {
                if (!model.selectedHome()) {
                    model.selectedHome(list[0]);
                }
            } else {
                model.selectedHome(false);
            }

            return list;
        }, (error) => {
            stat.printError(error);
            return [];
        });

        model.remove = (data) => {
            // TODO: This is not really safe, the path name of the location might have changed but the link names have not changed. As after a move operation on the location. Better to find relevant links based on path they point to and remove them.

            api.vfs.unlink(model.nodepath().path + "/homes/" + utils.basename(data.path))
            .then(() => {
                return api.vfs.unlink(data.path + "/residents/" + utils.basename(model.nodepath().path));
            })
            .then(() => {
                model.selectedHome(false);
                model.homes.reload();
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        let subscription = model.locationPath.subscribe((abspath) => {
            if (!abspath) {
                return;
            }

            api.vfs.symlink(abspath, model.nodepath().path + "/homes")
            .then(() => {
                return api.vfs.symlink(model.nodepath().path, abspath + "/residents");
            })
            .then(() => {
                model.selectedHome(false);
                model.homes.reload();
                model.locationPath(false);
            })
            .catch((error) => {
                stat.printError(error);
            });
        });

        model.dispose = () => {
            subscription.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated">
                <div className="row node-content" data-bind="if: nodepath">
                    <div className="col-md-6">
                        <h3>Contact information</h3>
                        <table className="table table-striped">
                            <tbody data-bind="foreach: nodepath().node().attributes.contact">
                                <tr>
                                    <td>
                                        <strong data-bind="text: $data.type"></strong>
                                    </td>
                                    <td data-bind="text: $data.data"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-md-6">
                        <h3>Homes</h3>

                        <input type="text" className="form-control" style={{ marginBottom: "15px" }} placeholder="Add a home location" data-bind="nodeselect: { root: '/locations', path: locationPath }, visible: nodepath().editable" />

                        <div className="list-group" data-bind="foreach: homes">
                            <a href="#" className="list-group-item" data-bind="css: { active: $parent.selectedHome() === $data }, click: $parent.selectedHome.bind($parent, $data)">
                                <i className="material-icons pull-right" data-bind="tooltip: 'Remove home', click: $root.remove, visible: $root.nodepath().editable">close</i>

                                <div data-bind="react: { name: 'file-widget-profile-picture', params: { size: 70, path: $data.path, nolazyload: true } }" className="pull-left" style={{ marginRight: "15px" }} ></div>

                                <h4 className="list-group-item-heading" data-bind="text: $data.node.attributes.name"></h4>
                                <p className="list-group-item-text" data-bind="html: $data.node.attributes.address.replace('\n','<br />')"></p>
                            </a>
                        </div>
                    </div>
                </div>
                <div style={{ height: "500px" }} data-bind="map: { position: position, zoom: position() ? 15 : 10 }"></div>
            </div>

        );
    }
}

export default PeopleSectionContact;
