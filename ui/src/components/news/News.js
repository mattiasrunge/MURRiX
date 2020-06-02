
import React from "react";
import moment from "moment";
import { Grid, Header } from "semantic-ui-react";
import { Header as HomeHeader } from "components/header";
import Component from "lib/component";
import ui from "lib/ui";
import DayInHistory from "./lib/DayInHistory";
import Latest from "./lib/Latest";
import theme from "./theme.module.css";

class News extends Component {
    render() {
        ui.setTitle("News");

        return (
            <Grid columns={2}>
                <Grid.Column width={8}>
                    <HomeHeader
                        icon="newspaper outline"
                        title="Latest"
                        subtitle="Latest added content"
                    />
                    <Latest theme={theme} />
                </Grid.Column>
                <Grid.Column width={8}>
                    <HomeHeader
                        icon="clock outline"
                        title="Events"
                        subtitle="Upcomming events"
                    />
                    <Header>Today</Header>
                    <DayInHistory
                        theme={theme}
                        date={moment().format("YYYY-MM-DD")}
                    />

                    <Header>Tomorrow</Header>
                    <DayInHistory
                        theme={theme}
                        date={moment().add(1, "day").format("YYYY-MM-DD")}
                    />
                </Grid.Column>
            </Grid>
        );
    }
}

export default News;
