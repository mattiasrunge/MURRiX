
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");
const session = require("lib/session");

class SearchPageSearch extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.query = ko.pureComputed({
            read: () => ko.unwrap(loc.current().query) || "",
            write: (value) => loc.goto({ query: value })
        });
        model.list = ko.asyncComputed([], async () => {
            if (model.query().length < 4) {
                return [];
            }

            let query = {};

            if (model.query().startsWith("label:")) {
                let labels = model.query().replace(/label:/, "").split("+");

                if (labels.length === 0) {
                    return [];
                }

                query = {
                    "attributes.labels": { $in: labels }
                };
            } else {
                query = {
                    "attributes.name": { $regex: ".*" + model.query() + ".*", $options: "-i" }
                };
            }

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
                    <h1>Search by name</h1>

                    <form className="form" role="search" style={{ marginBottom: "15px" }} data-bind="submit: () => false">
                        <input name="query" type="search" className="form-control" placeholder="Enter name to search for" data-bind="textInput: query" />
                    </form>
                </div>

                <div data-bind="react: { name: 'node-widget-card-list', params: { list: list } }"></div>
            </div>

        );
    }
}

export default SearchPageSearch;
