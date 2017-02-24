
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class AuthWidgetPictureUser extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.uid = ko.pureComputed(() => ko.unwrap(this.props.uid) || false);
        model.size = this.props.size;
        model.classes = ko.pureComputed(() => ko.unwrap(this.props.classes) || "");

        model.filename = ko.asyncComputed(false, async (setter) => {
            if (!model.uid()) {
                return false;
            }

            let filename = false;

            setter(false);

            model.loading(true);

            let id = await api.auth.picture(model.uid());

            if (id) {
                filename = await api.file.getMediaUrl(id, {
                    width: model.size,
                    height: model.size,
                    type: "image"
                });
            }

            model.loading(false);

            return filename;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return false;
        });

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<span data-bind="picture: { filename: filename, width: size, height: size, classes: classes, nolazyload: true }"></span>

        );
    }
}

export default AuthWidgetPictureUser;
