
import React from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import session from "lib/session";
import notification from "lib/notification";
import Component from "lib/component";
import { Search, Ref } from "semantic-ui-react";
import StarIcon from "./StarIcon";

class SearchInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            selected: false,
            list: [],
            searchQuery: "",
            loading: false
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

            if (this.state.selected && this.state.selected.node.path === path) {
                return;
            }

            this.setState({ loading: true });

            try {
                const node = await api.vfs.resolve(path);

                const selected = {
                    title: node.attributes.name,
                    node
                };

                this.setState({
                    searchQuery: selected.title,
                    selected,
                    list: [ selected ],
                    loading: false
                });
            } catch (error) {
                this.logError("Failed to run resolve", error);
                notification.add("error", error.message, 10000);
                this.setState({
                    searchQuery: "",
                    selected: false,
                    list: [],
                    loading: false
                });
            }
        } else {
            this.setState({
                searchQuery: "",
                selected: false,
                list: [],
                loading: false
            });
        }
    }

    onSearch(searchQuery) {
        this.searchTimer && clearTimeout(this.searchTimer);

        this.setState({ searchQuery, selected: false, list: [], loading: true });

        this.searchTimer = setTimeout(async () => {
            try {
                // TODO: List people etc
                const list = await api.vfs.list("/albums", {
                    search: searchQuery,
                    limit: 25
                });

                this.setState({
                    list: list.map((node) => ({
                        title: node.attributes.name,
                        node
                    })),
                    loading: false
                });
            } catch (error) {
                this.logError("Failed to run search", error);
                notification.add("error", error.message, 10000);
                this.setState({ loading: false });
            }
        }, 500);
    }

    onSelect(selected) {
        this.setState({ selected, searchQuery: selected.title, list: [ selected ] });
        this.context.router.history.push(`/node${selected.node.path}`);
    }

    onRef(ref) {
        this.ref = ref.getElementsByTagName("INPUT")[0];
    }

    onFocus() {
        this.ref && this.ref.select();
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest") {
            return null;
        }

        return (
            <div className={this.props.theme.navbarSearchInput}>
                <Ref innerRef={(ref) => this.onRef(ref)}>
                    <Search
                        className={`item ${this.props.theme.navbarSearchInputSearch} ${this.state.selected ? this.props.theme.navbarSearchInputSearchSelected : ""}`}
                        input={{ icon: "search", iconPosition: "left" }}
                        loading={this.state.loading}
                        onSearchChange={(e, { value }) => this.onSearch(value)}
                        onResultSelect={(e, { result }) => this.onSelect(result)}
                        value={this.state.searchQuery}
                        results={this.state.list}
                        disabled={!this.state.user || this.state.user.name === "guest"}
                        onFocus={() => this.onFocus()}
                    />
                </Ref>
                <StarIcon {...this.props} node={this.state.selected ? this.state.selected.node : null} />
            </div>
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
