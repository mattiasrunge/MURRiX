
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class FileWidgetProfilePicture extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.path = ko.pureComputed(() => ko.unwrap(this.props.path));
        model.classes = ko.pureComputed(() => ko.unwrap(this.props.classes));
        model.size = this.props.size;
        model.nolazyload = this.props.nolazyload;

        model.picturePath = ko.pureComputed(() => model.path() + "/profilePicture");
        model.picture = ko.nodepath(model.picturePath, { noerror: true });

        model.profileUrl = ko.asyncComputed(undefined, async (setter) => {
            let id = false;

            setter(undefined);

            if (model.picture()) {
                id = model.picture().node()._id;
            } else {
                let nodepath = (await api.vfs.list(model.path() + "/files", { noerror: true, limit: 1 }))[0];

                id = nodepath ? nodepath.node._id : false;
            }

            if (!id) {
                return false;
            }

            model.loading(true);

            let filename = await api.file.getMediaUrl(id, {
                width: model.size,
                height: model.size,
                type: "image"
            });

            console.log("profileUrl", filename);

            model.loading(false);

            return filename;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return false;
        });

        model.dispose = () => {
            model.picture.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="file-widget-profile-picture">
                ﻿<div className="text-center" data-bind="visible: loading, if: loading">
                    <i className="material-icons md-20 spin">cached</i>
                    <div>Loading...</div>
                </div>
                <div data-bind="if: profileUrl">
                    <div data-bind="picture: { filename: profileUrl, width: size, height: size, nolazyload: nolazyload, classes: classes }"></div>
                </div>
            </div>

        );
    }
}

export default FileWidgetProfilePicture;
