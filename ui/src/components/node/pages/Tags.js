
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Image, Loader, Header } from "semantic-ui-react";
import format from "lib/format";
import Component from "lib/component";
import notification from "lib/notification";
import utils from "lib/utils";
import { cmd } from "lib/backend";
import Thumbnail from "./lib/Thumbnail";
import theme from "../theme.module.css";

class Tags extends Component {
    constructor(props) {
        super(props);

        this.state = {
            days: [],
            loading: false
        };
    }

    async load() {
        await this.update();
    }

    async getDays() {
        const files = await cmd.filesbytags(this.props.node.path);

        utils.sortNodeList(files);

        let days = {};

        for (const file of files) {
            const day = file.attributes.time ? moment.utc(file.attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

            days[day] = days[day] || { files: [], time: file.attributes.time };
            days[day].files.push(file);
        }

        days = Object.keys(days).map((key) => days[key]);

        days.sort((a, b) => {
            if (!a.time) {
                return -1;
            } else if (!b.time) {
                return 1;
            }

            return a.time.timestamp - b.time.timestamp;
        });

        return days;
    }

    async update() {
        this.setState({ loading: true });

        try {
            const days = await this.getDays();

            !this.disposed && this.setState({ days, loading: false });
        } catch (error) {
            this.logError("Failed to load media", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ days: [], loading: false });
        }
    }

    render() {
        return (
            <div className={theme.mediaContainer}>
                <Loader
                    active={this.state.loading}
                    className={theme.mediaLoader}
                    content="Loading images..."
                    inline="centered"
                />
                <div>
                    <For each="day" of={this.state.days}>
                        <div
                            key={day.time ? day.time.timestamp : 0}
                            className={theme.mediaDay}
                        >
                            <If condition={day.time && day.time.timestamp}>
                                <Header as="h3">
                                    {format.displayTimeDay(day.time)}
                                </Header>
                            </If>
                            <Image.Group className={theme.mediaImageGroup}>
                                <For each="file" of={day.files}>
                                    <Thumbnail
                                        key={file._id}
                                        theme={theme}
                                        node={file}
                                        parentNode={this.props.node}
                                    />
                                </For>
                            </Image.Group>
                        </div>
                    </For>
                </div>
            </div>
        );
    }
}

Tags.propTypes = {
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Tags;
