
import React from "react";
import { Loader, Card } from "semantic-ui-react";
import ui from "lib/ui";
import useNodeData from "hooks/useNodeData";
import { PageHeader } from "components/header";
import Chart from "./Chart";
import backgroundColor from "./lib/colors";

const CHART_OPTS = {
    plugins: {
        legend: {
            display: false
        }
    }
};

const DATA_OPTS = {
    types: [ "a", "f", "p", "l" ]
};

const Content = () => {
    const [ nodeData, , loading ] = useNodeData(DATA_OPTS);
    const dataList = React.useMemo(() => (nodeData ? [
        {
            label: "Albums total",
            labels: nodeData.createdPerYear.a.labels,
            type: "line",
            datasets: [
                {
                    data: nodeData.createdPerYear.a.totals,
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
            label: "Files total",
            labels: nodeData.createdPerYear.f.labels,
            type: "line",
            datasets: [
                {
                    data: nodeData.createdPerYear.f.totals,
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
            label: "People total",
            labels: nodeData.createdPerYear.p.labels,
            type: "line",
            datasets: [
                {
                    data: nodeData.createdPerYear.p.totals,
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
            label: "Locations total",
            labels: nodeData.createdPerYear.l.labels,
            type: "line",
            datasets: [
                {
                    data: nodeData.createdPerYear.l.totals,
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
            label: "File size total (GiB)",
            labels: nodeData.fileSizeIncreasePerYear.labels,
            type: "line",
            datasets: [
                {
                    data: nodeData.fileSizeIncreasePerYear.totals,
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
    ] : []), [ nodeData ]);

    ui.setTitle("Charts of content");

    return (
        <div>
            <PageHeader
                title="Content"
                subtitle="Charts of content in the system"
                icon="chart line"
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

export default Content;
