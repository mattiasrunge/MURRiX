
import React from "react";
import PropTypes from "prop-types";
import { List } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import format from "lib/format";
import notification from "lib/notification";
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
            const events = await cmd.dayinhistory(this.props.date);

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
                                                <NodeLink node={event.person} />, born {event.date.year}, would have celebrated {event.person.attributes.gender === "m" ? "his" : "her"} <strong>{format.number(event.age.age)}</strong>, birthday, died {event.age.ageatdeath} years old
                                            </When>
                                            <Otherwise>
                                                <NodeLink node={event.person} />, born {event.date.year}, celebrates {event.person.attributes.gender === "m" ? "his" : "her"} <strong>{format.number(event.age.age)}</strong> birthday
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
    date: PropTypes.string.isRequired
};

export default DayInHistory;
