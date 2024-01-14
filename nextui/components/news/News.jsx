
import React from "react";
import moment from "moment";
import { Grid, Header } from "semantic-ui-react";
import ui from "lib/ui";
import { PageHeader } from "components/header";
import DayInHistory from "./lib/DayInHistory";
import Latest from "./lib/Latest";

const News = () => {
    ui.setTitle("News");

    return (
        <Grid columns={2}>
            <Grid.Column width={8}>
                <PageHeader
                    icon="newspaper outline"
                    title="Latest"
                    subtitle="Latest added content"
                />
                <Latest />
            </Grid.Column>
            <Grid.Column width={8}>
                <PageHeader
                    icon="clock outline"
                    title="Events"
                    subtitle="Upcomming events"
                />
                <Header>Today</Header>
                <DayInHistory
                    date={moment().format("YYYY-MM-DD")}
                />

                <Header>Tomorrow</Header>
                <DayInHistory
                    date={moment().add(1, "day").format("YYYY-MM-DD")}
                />
            </Grid.Column>
        </Grid>
    );
};

export default News;
