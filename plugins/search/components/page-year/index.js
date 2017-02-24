
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");

class SearchPageYear extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.year = ko.pureComputed({
            read: () => parseInt(ko.unwrap(loc.current().year), 10) || new Date().getFullYear(),
            write: (value) => loc.goto({ year: value })
        });
        model.list = ko.asyncComputed([], async (setter) => {
            setter([]);

            model.loading(true);

            let list = await api.search.findByYear(model.year());

            model.loading(false);

            ui.setTitle("Browsing " + model.year());

            return list.map((item) => {
                item.node = ko.observable(item.node);
                return item;
            });
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        }, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

        model.yearIncClicked = () => {
            model.year(model.year() + 1);
        };

        model.yearDecClicked = () => {
            model.year(model.year() - 1);
        };

        ui.setTitle("Browse year");

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Search by year</h1>

                    <div style={{ marginBottom: "25px" }}>
                        <div style={{ textAlign: "center" }}>
                            <span data-bind="visible: !loading()">
                            Showing <span data-bind="text: year"></span>
                            </span>

                            <span data-bind="visible: loading" style={{ display: "none" }}>
                            Loading <span data-bind="text: year"></span>...
                            </span>
                        </div>

                        <a className="pull-right btn btn-primary" data-bind="click: yearIncClicked, clickKey: 'right'"><i className="material-icons">add</i></a>
                        <a className="pull-left btn btn-primary" data-bind="click: yearDecClicked, clickKey: 'left'"><i className="material-icons">remove</i></a>

                        <div className="year-slider">
                            <div data-bind="yearSlider: { year: year }"></div>
                        </div>
                    </div>
                    {/* <div style={{ marginBottom: "15px" }}>
                        <div className="btn-group btn-group-justified" role="group">
                            <a type="button" className="btn btn-default">Jan</a>
                            <a type="button" className="btn btn-default">Feb</a>
                            <a type="button" className="btn btn-default">Mar</a>
                            <a type="button" className="btn btn-default">Apr</a>
                            <a type="button" className="btn btn-default">May</a>
                            <a type="button" className="btn btn-default">Jun</a>
                            <a type="button" className="btn btn-default">Jul</a>
                            <a type="button" className="btn btn-default">Aug</a>
                            <a type="button" className="btn btn-default">Sep</a>
                            <a type="button" className="btn btn-default">Oct</a>
                            <a type="button" className="btn btn-default">Nov</a>
                            <a type="button" className="btn btn-default">Dec</a>
                        </div>
                    </div> */}
                </div>

                <div data-bind="react: { name: 'node-widget-card-list', params: { list: list } }"></div>
            </div>

        );
    }
}

export default SearchPageYear;
