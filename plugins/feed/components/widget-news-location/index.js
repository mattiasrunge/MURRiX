
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class FeedWidgetNewsLocation extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));

        model.position = ko.asyncComputed(false, async () => {
            if (!model.item()) {
                return false;
            }

            if (!model.item().node().attributes.address) {
                return false;
            }

            return await api.lookup.getPositionFromAddress(model.item().node().attributes.address.replace("<br>", "\n"));
        }, (error) => {
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
                <div className="news-media" data-bind="visible: position, if: position">
                    <div style={{ height: "270px", marginRight: "1px" }} data-bind="map: { position: position, zoom: position() ? 15 : 10 }"></div>
                </div>
                <div className="news-name" data-bind="visible: item, if: item">
                    <a href="#" data-bind="location: { page: 'node', path: nodepath().node().attributes.path }">
                        <h4 data-bind="text: item().node().attributes.name"></h4>
                    </a>
                </div>
                <div className="news-description" data-bind="visible: item() && item().node().attributes.description !== '', if: item() && item().node().attributes.description !== ''">
                    <span data-bind="html: item().node().attributes.description"></span>
                </div>
            </div>

        );
    }
}

export default FeedWidgetNewsLocation;
