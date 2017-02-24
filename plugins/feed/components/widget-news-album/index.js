
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class FeedWidgetNewsAlbum extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.width = 156;
        model.height = 270;

        model.fileListPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path + "/files" : false);
        model.fileList = ko.nodepathList(model.fileListPath, { limit: 3, noerror: true });


        model.files = ko.asyncComputed([], async (setter) => {
            if (model.fileList().length === 0) {
                return [];
            }

            setter([]);

            let ids = model.fileList().map((file) => file.node()._id);

            model.loading(true);
            let filenames = await api.file.getMediaUrl(ids, {
                width: model.width,
                height: model.height,
                type: "image"
            });


            model.loading(false);

            let files = model.fileList().map((file) => {
                file.filename = filenames[file.node()._id] || false;
                return file;
            });

            console.log("files", files);

            return files;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        });

        model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
        model.item = ko.nodepath(model.itemPath, { noerror: true });

        model.dispose = () => {
            model.fileList.dispose();
            model.item.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="news-media" data-bind="visible: item, if: item">
                    <div className="text-center" data-bind="visible: loading, if: loading">
                        <i className="material-icons md-48 spin">cached</i>
                        <div><strong>Loading...</strong></div>
                    </div>
                    <div className="news-media-files clearfix" data-bind="foreach: files"><a href="#" data-bind="picture: { item: $data, width: $root.width, height: $root.height }, location: { page: 'node', path: $root.nodepath().node().attributes.path }, attr: { title: $data.node().attributes.name }" style={{ float: "left" }}></a></div>
                </div>
                <div className="news-name" data-bind="visible: item, if: item">
                    <a href="#" data-bind="location: { page: 'node', path: nodepath().node().attributes.path }">
                        <h4 data-bind="text: item().node().attributes.name"></h4>
                    </a>
                </div>
                <div className="news-description text-muted" data-bind="visible: item() && item().node().attributes.description !== '', if: item() && item().node().attributes.description !== ''">
                    <p data-bind="html: item().node().attributes.description"></p>
                </div>
            </div>

        );
    }
}

export default FeedWidgetNewsAlbum;
