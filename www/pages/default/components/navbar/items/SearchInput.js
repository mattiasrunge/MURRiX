
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import session from "lib/session";
import notification from "lib/notification";
import Component from "lib/component";
// import StarIcon from "./StarIcon";
import { NodeInput } from "components/nodeparts";

class SearchInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            selected: null,
            loading: false,
            paths: [
                "/people",
                "/cameras",
                "/locations",
                "/albums"
            ]
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
        this.setFromLocation(this.props.location);
    }

    componentWillReceiveProps(nextProps) {
        this.setFromLocation(nextProps.location);
    }

    async setFromLocation(location) {
        if (location.pathname.startsWith("/node")) {
            const path = location.pathname.replace(/^\/node/, "");

            if (this.state.selected && this.state.selected.path === path) {
                return;
            }

            this.setState({ loading: true });

            try {
                const node = await api.vfs.resolve(path);

                this.setState({
                    selected: node,
                    loading: false
                });
            } catch (error) {
                this.logError("Failed to run resolve", error);
                notification.add("error", error.message, 10000);
                this.setState({
                    selected: null,
                    loading: false
                });
            }
        } else {
            this.setState({
                selected: null,
                loading: false
            });
        }
    }

    onSelect = (selected) => {
        this.setState({ selected });
        selected && this.context.router.history.push(`/node${selected.path}`);
    }

    onSearch = (e, query) => {
        if (e.which === 13 && !this.state.selected && query) {
            this.context.router.history.push(`/home/search/${query}`);
        }
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest") {
            return null;
        }

        return (
            <Fragment>
                <NodeInput
                    value={this.state.selected}
                    paths={this.state.paths}
                    iconPosition="left"
                    onChange={this.onSelect}
                    loading={this.state.loading}
                    placeholder="Search..."
                    onKeyUp={this.onSearch}
                />
                {/* <StarIcon {...this.props} node={this.state.selected ? this.state.selected : null} /> */}
            </Fragment>
        );
    }
}

SearchInput.propTypes = {
    theme: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

SearchInput.contextTypes = {
    router: PropTypes.object.isRequired
};

export default SearchInput;
