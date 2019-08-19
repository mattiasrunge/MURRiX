
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Loader, Card } from "semantic-ui-react";
import { Header } from "components/home";
import { cmd } from "lib/backend";
import Component from "lib/component";
import notification from "lib/notification";
import ui from "lib/ui";
import Chart from "./Chart";
import backgroundColor from "./lib/colors";

class Content extends Component {
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
            const nodeData = await cmd.nodedata({ types: [ "a", "f", "p", "l" ] });

            const dataList = [
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
        ui.setTitle("Content");

        return (
            <div>
                <Header
                    title="Content"
                    subtitle="Charts of content in the system"
                    icon="chart line"
                />
                <Loader
                    active={this.state.loading}
                    inline="centered"
                />
                <Card.Group itemsPerRow="2">
                    <For each="data" of={this.state.dataList}>
                        <Chart
                            key={data.label}
                            data={data}
                            options={this.state.options}
                        />
                    </For>
                </Card.Group>
            </div>
        );
    }
}

Content.propTypes = {
    theme: PropTypes.object
};

export default Content;
