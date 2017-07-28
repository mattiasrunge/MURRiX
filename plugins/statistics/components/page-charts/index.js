
import React from "react";
import Component from "lib/component";
import StatisticsWidgetChart from "plugins/statistics/components/widget-chart";

import moment from "moment";
import api from "api.io-client";
import ui from "lib/ui";
import stat from "lib/status";

class StatisticsPageCharts extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dataList: [],
            options: {
                tooltips: {
                    enabled: false
                },
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                beginAtZero: true
                            }
                        }
                    ]
                }
            }
        };
    }

    componentDidMount() {
        this.load();

        ui.setTitle("Statistics");
    }

    async load() {
        const backgroundColor = [
            "rgba(255, 204, 204, 0.8)",
            "rgba(255, 230, 204, 0.8)",
            "rgba(255, 255, 204, 0.8)",
            "rgba(230, 255, 204, 0.8)",
            "rgba(204, 255, 204, 0.8)",
            "rgba(204, 255, 230, 0.8)",
            "rgba(204, 255, 255, 0.8)",
            "rgba(204, 230, 255, 0.8)",
            "rgba(255, 204, 255, 0.8)",
            "rgba(230, 204, 255, 0.8)",
            "rgba(255, 204, 255, 0.8)",
            "rgba(255, 204, 230, 0.8)"
        ];

        try {
            const result = await api.statistics.getEventData();

            const dataList = [
                {
                    label: "Births each month",
                    labels: moment.monthsShort(),
                    datasets: [
                        {
                            data: result.birth,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Engagements each month",
                    labels: moment.monthsShort(),
                    datasets: [
                        {
                            data: result.engagement,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Marriages each month",
                    labels: moment.monthsShort(),
                    datasets: [
                        {
                            data: result.marriage,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Deaths each month",
                    labels: moment.monthsShort(),
                    datasets: [
                        {
                            data: result.death,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                }
            ];

            this.setState({ dataList });
        } catch (error) {
            stat.printError(error);
        }
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Charts</h1>

                    <For each="data" of={this.state.dataList}>
                        <h2>{data.label}</h2>
                        <div style={{ marginBottom: "15px" }}>
                        <StatisticsWidgetChart
                            type="bar"
                            data={data}
                            options={this.state.options}
                        />
                        </div>
                    </For>
                </div>
            </div>
        );
    }
}

export default StatisticsPageCharts;
