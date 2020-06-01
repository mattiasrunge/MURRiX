
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import { api } from "lib/backend";
import session from "lib/session";
import notification from "lib/notification";
import Component from "lib/component";

class RandomButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            loading: false
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    async onRandom() {
        const includePaths = [ "/albums" ];
        const excludePaths = [];

        if (this.props.location.pathname.startsWith("/node")) {
            excludePaths.push(this.props.location.pathname.replace(/^\/node/, ""));
        }

        this.setState({ loading: true });

        try {
            const node = await api.random(includePaths, excludePaths);

            this.setState({ loading: false });

            this.props.history.push(`/node${node.path}`);
        } catch (error) {
            this.logError("Failed to get random", error);
            notification.add("error", error.message, 10000);
            this.setState({ loading: false });
        }
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest") {
            return null;
        }

        return (
            <Menu.Item
                icon="random"
                fitted="vertically"
                onClick={() => this.onRandom()}
                disabled={this.state.loading}
            />
        );
    }
}

RandomButton.propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(RandomButton);
