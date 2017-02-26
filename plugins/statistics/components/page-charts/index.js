
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

class StatisticsPageCharts extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();

        model.data = ko.asyncComputed([], async (setter) => {
            setter(false);

            model.loading(true);
            let result = await api.statistics.getEventData();
            model.loading(false);

            let data = [
                {
                    label: "Births each month",
                    labels: moment.monthsShort(),
                    data: result.birth
                },
                {
                    label: "Engagements each month",
                    labels: moment.monthsShort(),
                    data: result.engagement
                },
                {
                    label: "Marriages each month",
                    labels: moment.monthsShort(),
                    data: result.marriage
                },
                {
                    label: "Deaths each month",
                    labels: moment.monthsShort(),
                    data: result.death
                }
            ];

            console.log("event data", result, data);

            return data;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return false;
        });

        ui.setTitle("Charts");

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Charts</h1>

                    <div data-bind="foreach: data">
                        <h2 data-bind="text: $data.label"></h2>
                        <div style={{ marginBottom: "15px" }}>
                            <canvas data-bind="barchart: $data"></canvas>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default StatisticsPageCharts;
