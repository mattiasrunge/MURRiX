
import React from "react";
import moment from "moment";
import { Loader, Card } from "semantic-ui-react";
import ui from "lib/ui";
import useEventData from "hooks/useEventData";
import { PageHeader } from "components/header";
import Chart from "./Chart";
import backgroundColor from "./lib/colors";

const CHART_OPTS = {
    plugins: {
        tooltip: {
            enabled: false
        },
        legend: {
            display: false
        }
    }
};

const Events = () => {
    const [ eventData, , loading ] = useEventData();
    const dataList = React.useMemo(() => (eventData ? [
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
    ] : []), [ eventData ]);

    ui.setTitle("Charts of events");

    return (
        <div>
            <PageHeader
                title="Events"
                subtitle="Charts of events"
                icon="chart bar"
            />
            <Loader
                active={loading}
                inline="centered"
            />
            <Card.Group itemsPerRow="2">
                <For each="data" of={dataList}>
                    <Chart
                        key={data.label}
                        data={data}
                        options={CHART_OPTS}
                    />
                </For>
            </Card.Group>
        </div>
    );
};

export default Events;
