
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");
const session = require("lib/session");

class SearchPageLabels extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.query = ko.pureComputed({
            read: () => ko.unwrap(loc.current().query) || "",
            write: (value) => loc.goto({ query: value })
        });
        model.list = ko.asyncComputed([], async () => {
            let labels = model.query().split("+");

            if (labels.length === 0) {
                return [];
            }

            let query = {
                "attributes.labels": { $in: labels }
            };

            model.loading(true);

            let list = await api.vfs.list(session.searchPaths(), { filter: query });

            model.loading(false);

            ui.setTitle("Search for " + model.query());

            return list.map((item) => {
                item.node = ko.observable(item.node);
                return item;
            });
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        }, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

        model.labels = ko.asyncComputed([], async () => {
            return await api.vfs.labels();
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        }, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

        ui.setTitle("Search");

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Browse by label</h1>

                    <div style={{ marginBottom: "15px" }} data-bind="foreach: labels">
                        <a role="button" className="btn btn-default" data-bind="css: { 'btn-primary': $data === $parent.query() }, text: $data, attr: { href: '#page=labels&query=' + $data }" style={{ marginRight: "5px", marginBottom: "10px" }}></a>
                    </div>
                </div>

                <div data-bind="react: { name: 'node-widget-card-list', params: { list: list } }"></div>
            </div>

        );
    }
}

export default SearchPageLabels;
