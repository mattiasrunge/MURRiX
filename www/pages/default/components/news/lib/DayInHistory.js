
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { List } from "semantic-ui-react";
import { NodeLink } from "components/nodeparts";

class DayInHistory extends Component {
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
            const events = await api.murrix.dayinhistory(this.props.date);

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
            <List relaxed>
                <For each="event" of={this.state.events}>
                    <List.Item key={event.node._id}>
                        <Choose>
                            <When condition={event.type === "marriage"}>
                                <List.Icon name="heart" />
                            </When>
                            <When condition={event.type === "engagement"}>
                                <List.Icon name="heart outline" />
                            </When>
                            <When condition={event.type === "birthday"}>
                                <List.Icon name="birthday" />
                            </When>
                        </Choose>
                        <List.Content>
                            <List.Description>
                                <Choose>
                                    <When condition={event.type === "marriage"}>
                                        <Choose>
                                            <When condition={event.people.length === 1}>
                                                <NodeLink node={event.people[0]} /> was married <strong>{event.years}</strong> year(s) ago, {event.date.year}
                                            </When>
                                            <Otherwise>
                                                <NodeLink node={event.people[0]} /> and <NodeLink node={event.people[1]} /> were married <strong>{event.years}</strong> year(s) ago, {event.date.year}
                                            </Otherwise>
                                        </Choose>
                                    </When>
                                    <When condition={event.type === "engagement"}>
                                        <Choose>
                                            <When condition={event.people.length === 1}>
                                                <NodeLink node={event.people[0]} /> was engaged <strong>{event.years}</strong> year(s) ago, {event.date.year}
                                            </When>
                                            <Otherwise>
                                                <NodeLink node={event.people[0]} /> and <NodeLink node={event.people[1]} /> were engaged <strong>{event.years}</strong> year(s) ago, {event.date.year}
                                            </Otherwise>
                                        </Choose>
                                    </When>
                                    <When condition={event.type === "birthday"}>
                                        <Choose>
                                            <When condition={event.age.ageatdeath}>
                                                <NodeLink node={event.person} /> would have turned <strong>{event.age.age}</strong>, died age {event.age.ageatdeath}, born {event.date.year}
                                            </When>
                                            <Otherwise>
                                                <NodeLink node={event.person} /> turns <strong>{event.age.age}</strong>, born {event.date.year}
                                            </Otherwise>
                                        </Choose>
                                    </When>
                                </Choose>
                            </List.Description>
                        </List.Content>
                    </List.Item>
                </For>
            </List>
        );
    }
}

DayInHistory.propTypes = {
    theme: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired
};

export default DayInHistory;
