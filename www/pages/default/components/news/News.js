
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import moment from "moment";
import { Header, Grid } from "semantic-ui-react";
import ui from "lib/ui";
import DayInHistory from "./lib/DayInHistory";
import Latest from "./lib/Latest";

class News extends Component {
    render() {
        ui.setTitle("News");

        return (
            <Grid columns={2}>
                <Grid.Column width={8}>
                    <Header>Latest</Header>
                    <Latest theme={this.props.theme} />
                </Grid.Column>
                <Grid.Column width={8}>
                    <Header>Today</Header>
                    <DayInHistory
                        theme={this.props.theme}
                        date={moment().format("YYYY-MM-DD")}
                    />

                    <Header>Tomorrow</Header>
                    <DayInHistory
                        theme={this.props.theme}
                        date={moment().add(1, "day").format("YYYY-MM-DD")}
                    />
                </Grid.Column>
            </Grid>
        );
    }
}

News.propTypes = {
    theme: PropTypes.object.isRequired
};

export default News;
