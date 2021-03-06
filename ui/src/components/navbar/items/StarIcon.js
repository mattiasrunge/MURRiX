
import React from "react";
import PropTypes from "prop-types";
import { Rating } from "semantic-ui-react";
import { api, event } from "lib/backend";
import session from "lib/session";
import notification from "lib/notification";
import Component from "lib/component";
import theme from "../theme.module.css";

class StarIcon extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            stars: []
        };
    }

    async load() {
        this.addDisposables([
            session.on("update", async (event, user) => {
                this.setState({ user });
                await this.update();
            }),
            event.on("node.appendChild", () => this.update()),
            event.on("node.removeChild", () => this.update())
        ]);

        await this.update();
    }

    async update() {
        if (!this.state.user || this.state.user.name === "guest") {
            return;
        }

        try {
            const stars = await api.stars();

            this.setState({ stars });
        } catch (error) {
            this.logError("Failed to get stars", error);
        }
    }

    async onToggleStar() {
        try {
            await api.star(this.props.node.path);
        } catch (error) {
            this.logError("Failed to toggle star", error);
            notification.add("error", "Failed to toggle star", 10000);
        }
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest" || !this.props.node) {
            return null;
        }

        const starred = this.state.stars.some((node) => node.path === this.props.node.path);

        return (
            <Rating
                className={theme.navbarStarIcon}
                icon="star"
                size="huge"
                rating={starred ? 1 : 0}
                onRate={() => this.onToggleStar()}
            />
        );
    }
}

StarIcon.propTypes = {
    node: PropTypes.object
};

export default StarIcon;
