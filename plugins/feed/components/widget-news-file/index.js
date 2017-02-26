
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class FeedWidgetNewsFile extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.size = 470;

        model.filename = ko.asyncComputed(false, async (setter) => {
            if (!model.item()) {
                return false;
            }

            setter(false);

            model.loading(true);

            let filename = await api.file.getMediaUrl(model.item().node()._id, {
                width: model.size,
                type: "image"
            });

            console.log("filename", filename);

            model.loading(false);

            return filename;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return false;
        });

        model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
        model.item = ko.nodepath(model.itemPath, { noerror: true });

        model.dispose = () => {
            model.item.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="news-media">
                    <a href="#" data-bind="location: { showPath: nodepath().node().attributes.path }">
                        <div data-bind="picture: { filename: filename, width: size, classes: 'img-responsive' }"></div>
                    </a>
                </div>
                <div className="news-description" data-bind="visible: item() && item().node().attributes.description !== '', if: item() && item().node().attributes.description !== ''">
                    <span data-bind="html: item().node().attributes.description"></span>
                </div>
            </div>

        );
    }
}

export default FeedWidgetNewsFile;
