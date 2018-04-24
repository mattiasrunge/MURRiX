
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import format from "lib/format";
import { Feed, Loader } from "semantic-ui-react";
import { NodeLink, NodeImage } from "components/nodeparts";

class Latest extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            events: []
        };
    }

    async load() {
        this.setState({ loading: true });

        try {
            const events = await api.murrix.latest(20);

            this.setState({
                events,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load events", error);
            notification.add("error", error.message, 10000);
            this.setState({
                loading: false,
                events: []
            });
        }
    }

    render() {
        return (
            <Feed>
                <If condition={this.state.loading}>
                    <div className={this.props.theme.loader}>
                        <Loader active>Loading...</Loader>
                    </div>
                </If>
                <For each="event" of={this.state.events}>
                    <Feed.Event key={event.node._id}>
                        <Feed.Label>
                            <NodeImage
                                path={`${event.userpath}/person/profilePicture`}
                                avatar
                                format={{
                                    width: 50,
                                    height: 50,
                                    type: "image"
                                }}
                                noFixedSize
                            />
                        </Feed.Label>
                        <Feed.Content>
                            <Feed.Date>{format.datetimeAgo(event.time)}</Feed.Date>
                            <Feed.Summary>
                                {event.username} created <NodeLink node={event.node} />
                            </Feed.Summary>
                            <If condition={event.files.length > 0}>
                                <Feed.Extra images>
                                    <For each="file" of={event.files}>
                                        <NodeImage
                                            key={file._id}
                                            path={file.path}
                                            format={{
                                                width: 216,
                                                height: 216,
                                                type: "image"
                                            }}
                                            noFixedSize
                                        />
                                    </For>
                                </Feed.Extra>
                            </If>
                            <br />
                        </Feed.Content>
                    </Feed.Event>
                </For>
            </Feed>
        );
    }
}

Latest.propTypes = {
    theme: PropTypes.object.isRequired
};


export default Latest;
