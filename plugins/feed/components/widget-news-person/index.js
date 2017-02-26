
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const utils = require("lib/utils");

class FeedWidgetNewsPerson extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));

        model.itemPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().node().attributes.path : false);
        model.item = ko.nodepath(model.itemPath, { noerror: true });

        model.dispose = () => {
            model.item.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="news-media">
                    <div data-bind="react: { name: 'file-widget-profile-picture', params: { size: 200, path: nodepath().node().attributes.path } }" style={{ marginRight: "15px" }}></div>
                </div>
                <div className="news-name" data-bind="visible: item, if: item">
                    <a href="#" data-bind="location: { page: 'node', path: nodepath().node().attributes.path }">
                        <h4 data-bind="text: item().node().attributes.name"></h4>
                    </a>
                </div>
                <div className="news-description text-muted" data-bind="visible: item() && item().node().attributes.description !== '', if: item() && item().attributes.node().description !== ''">
                    <p data-bind="html: item().node().attributes.description"></p>
                </div>
            </div>

        );
    }
}

export default FeedWidgetNewsPerson;
