
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import format from "lib/format";
import Component from "lib/component";
import notification from "lib/notification";
import utils from "lib/utils";
import api from "api.io-client";
import { Image, Loader, Header } from "semantic-ui-react";
import Thumbnail from "./lib/Thumbnail";

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
        const files = await api.murrix.filesbytags(this.props.node.path);

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
            <div className={this.props.theme.mediaContainer}>
                <Loader
                    active={this.state.loading}
                    className={this.props.theme.mediaLoader}
                    content="Loading images..."
                    inline="centered"
                />
                <div>
                    <For each="day" of={this.state.days}>
                        <div
                            key={day.time ? day.time.timestamp : 0}
                            className={this.props.theme.mediaDay}
                        >
                            <If condition={day.time && day.time.timestamp}>
                                <Header as="h3">
                                    {format.displayTimeDay(day.time)}
                                </Header>
                            </If>
                            <Image.Group className={this.props.theme.mediaImageGroup}>
                                <For each="file" of={day.files}>
                                    <Thumbnail
                                        key={file._id}
                                        theme={this.props.theme}
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
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Tags;
