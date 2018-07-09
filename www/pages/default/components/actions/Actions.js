
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header, Card } from "semantic-ui-react";
import ListAction from "./lib/ListAction";

class Actions extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            actions: []
        };
    }

    async load() {
        this.setState({ loading: true });

        try {
            const actions = await api.vfs.actiontypes(this.props.node.properties.type);

            !this.disposed && this.setState({ loading: false, actions });
        } catch (error) {
            this.logError("Failed to get actions for node", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ loading: false, actions: [] });
        }
    }

    render() {
        return (
            <div>
                <Header
                    as="h2"
                    content="Actions"
                    subheader={{
                        content: "Execute actions"
                    }}
                />
                <Card.Group itemsPerRow="2">
                    <For each="action" of={this.state.actions}>
                        <Choose>
                            <When condition={action.type === "list"}>
                                <ListAction
                                    key={action.name}
                                    theme={this.props.theme}
                                    action={action}
                                    node={this.props.node}
                                />
                            </When>
                        </Choose>
                    </For>
                </Card.Group>
            </div>
        );
    }
}

Actions.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Actions;
