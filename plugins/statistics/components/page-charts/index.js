
import moment from "moment";
import api from "api.io-client";
import ui from "lib/ui";
import stat from "lib/status";
import React from "react";
import Component from "lib/component";
import StatisticsWidgetChart from "plugins/statistics/components/widget-chart";

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
            const eventData = await api.statistics.getEventData();
            const nodeData = await api.statistics.getNodeData({ types: [ "a", "f", "p", "l" ] });

            const dataList = [
                {
                    label: "Births each month",
                    labels: moment.monthsShort(),
                    datasets: [
                        {
                            data: eventData.birth,
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
                            data: eventData.engagement,
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
                            data: eventData.marriage,
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
                            data: eventData.death,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Album increase per year",
                    labels: nodeData.createdPerYear.a.labels,
                    type: "line",
                    datasets: [
                        {
                            data: nodeData.createdPerYear.a.increase,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Albums added per year",
                    labels: nodeData.createdPerYear.a.labels,
                    datasets: [
                        {
                            data: nodeData.createdPerYear.a.values,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "File increase per year",
                    labels: nodeData.createdPerYear.f.labels,
                    type: "line",
                    datasets: [
                        {
                            data: nodeData.createdPerYear.f.increase,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Files added per year",
                    labels: nodeData.createdPerYear.f.labels,
                    datasets: [
                        {
                            data: nodeData.createdPerYear.f.values,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "People increase per year",
                    labels: nodeData.createdPerYear.p.labels,
                    type: "line",
                    datasets: [
                        {
                            data: nodeData.createdPerYear.p.increase,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "People added per year",
                    labels: nodeData.createdPerYear.p.labels,
                    datasets: [
                        {
                            data: nodeData.createdPerYear.p.values,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Location increase per year",
                    labels: nodeData.createdPerYear.l.labels,
                    type: "line",
                    datasets: [
                        {
                            data: nodeData.createdPerYear.l.increase,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "Locations added per year",
                    labels: nodeData.createdPerYear.l.labels,
                    datasets: [
                        {
                            data: nodeData.createdPerYear.l.values,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "File size increase per year (GiB)",
                    labels: nodeData.fileSizeIncreasePerYear.labels,
                    type: "line",
                    datasets: [
                        {
                            data: nodeData.fileSizeIncreasePerYear.increase,
                            borderWidth: 1,
                            backgroundColor
                        }
                    ]
                },
                {
                    label: "File size per year (GiB)",
                    labels: nodeData.fileSizeIncreasePerYear.labels,
                    datasets: [
                        {
                            data: nodeData.fileSizeIncreasePerYear.values,
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
                <div className="page-header">
                    <h1>Charts</h1>
                </div>
                <div className="chart-container">
                    <For each="data" of={this.state.dataList}>
                        <div className="chart-item" key={data.label}>
                            <div className="chart-name">
                                <h4>{data.label}</h4>
                            </div>
                            <div className="chart-chart">
                                <StatisticsWidgetChart
                                    type={data.type || "bar"}
                                    data={data}
                                    options={this.state.options}
                                />
                            </div>
                        </div>
                    </For>
                </div>
            </div>
        );
    }
}

export default StatisticsPageCharts;
