
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Loader, Card } from "semantic-ui-react";
import { Header } from "components/header";
import { api } from "lib/backend";
import Component from "lib/component";
import notification from "lib/notification";
import ui from "lib/ui";
import Chart from "./Chart";
import backgroundColor from "./lib/colors";

class Events extends Component {
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
            const eventData = await api.eventdata();

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
        ui.setTitle("Events");

        return (
            <div>
                <Header
                    title="Events"
                    subtitle="Charts of events"
                    icon="chart bar"
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

Events.propTypes = {
    theme: PropTypes.object
};

export default Events;
