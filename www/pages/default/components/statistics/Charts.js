
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Loader, Header, Card } from "semantic-ui-react";
import api from "api.io-client";
import Component from "lib/component";
import notification from "lib/notification";
import ui from "lib/ui";
import Chart from "./Chart";

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

class Charts extends Component {
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
            },
            loading: false
        };
    }

    async load() {
        await this.update();
    }

    async update() {
        this.setState({ loading: true });

        try {
            const eventData = await api.statistics.eventdata();
            const nodeData = await api.statistics.nodedata({ types: [ "a", "f", "p", "l" ] });

            const dataList = [
                {
                    label: "Births",
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
                    label: "Engagements",
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
                    label: "Marriages",
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
                    label: "Deaths",
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
                    label: "Album increase",
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
                    label: "Albums added",
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
                    label: "File increase",
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
                    label: "Files added",
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
                    label: "People increase",
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
                    label: "People added",
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
                    label: "Location increase",
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
                    label: "Locations added",
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
                    label: "File size increase (GiB)",
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
                    label: "Added file size (GiB)",
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

            !this.disposed && this.setState({ dataList, loading: false });
        } catch (error) {
            this.logError("Failed to load", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ dataList: [], loading: false });
        }
    }

    render() {
        ui.setTitle("Charts");

        return (
            <div>
                <Header>Charts</Header>
                <Loader
                    active={this.state.loading}
                    inline="centered"
                />
                <Card.Group itemsPerRow="2">
                    <For each="data" of={this.state.dataList}>
                        <Card key={data.label}>
                            <Card.Content>
                                <Card.Header>{data.label}</Card.Header>
                                <Card.Description style={{ marginTop: "2em" }}>
                                    <Chart
                                        type={data.type || "bar"}
                                        data={data}
                                        options={this.state.options}
                                    />
                                </Card.Description>
                            </Card.Content>
                        </Card>
                    </For>
                </Card.Group>
            </div>
        );
    }
}

Charts.propTypes = {
    theme: PropTypes.object
};

export default Charts;
