
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Route, Switch, Redirect } from "react-router-dom";
import api from "api.io-client";
import ui from "lib/ui";
import notification from "lib/notification";
import { Container } from "semantic-ui-react";
import { NodeHeader } from "components/nodeparts";
import Media from "./pages/Media";
import Map from "./pages/Map";
import Family from "./pages/Family";
import Settings from "./pages/Settings";
import Timeline from "./pages/Timeline";

class Node extends Component {
    constructor(props) {
        super(props);

        this.state = {
            node: false,
            loading: false,
            page: false
        };
    }

    async load() {
        this.setFromMatch(this.props.match);
        this.addDisposable(api.vfs.on("node.update", (path) => {
            if (path === this.state.node.path) {
                this.update(path, this.state.page);
            }
        }));
    }

    componentWillReceiveProps(nextProps) {
        this.setFromMatch(nextProps.match);
    }

    async setFromMatch(match) {
        const url = `/${match.params[0]}`;
        const [ path, pagePart ] = url.split("/_/");
        const [ page ] = pagePart ? pagePart.split("/") : [];

        if (this.state.node && this.state.node.path === path) {
            if (page !== this.state.page) {
                this.setState({ page });
            }

            return;
        }

        await this.update(path, page);
    }

    async update(path, page) {
        this.setState({ loading: true });

        try {
            const node = await api.vfs.resolve(path);

            this.setState({ node, loading: false, page });
        } catch (error) {
            this.logError("Failed to load node", error);
            notification.add("error", error.message, 10000);
            this.setState({ node: false, loading: false });
        }
    }

    onPage = (e, { name }) => {
        this.context.router.history.push(`/node${this.state.node.path}/_/${name}`);
    }

    render() {
        ui.setTitle(this.state.node ? this.state.node.attributes.name : null);

        const pages = [
            {
                name: "media",
                title: "Media",
                icon: "image",
                active: this.state.page === "media",
                onClick: this.onPage,
                Component: Media
            },
            {
                name: "timeline",
                title: "Timeline",
                icon: "time",
                active: this.state.page === "timeline",
                onClick: this.onPage,
                Component: Timeline
            },
            {
                name: "map",
                title: "Map",
                icon: "map outline",
                active: this.state.page === "map",
                onClick: this.onPage,
                Component: Map
            },
            {
                name: "family",
                title: "Family",
                icon: "sitemap",
                active: this.state.page === "family",
                onClick: this.onPage,
                Component: Family
            },
            {
                name: "settings",
                title: "Settings",
                icon: "setting",
                active: this.state.page === "settings",
                onClick: this.onPage,
                Component: Settings
            }
        ];

        return (
            <Container className={this.props.theme.nodeContainer}>
                <Choose>
                    <When condition={!this.state.node}>
                        Nothing loaded!
                    </When>
                    <Otherwise>
                        <NodeHeader
                            node={this.state.node}
                            pages={pages}
                        />
                        <Switch>
                            <Route path={`/node${this.state.node.path}/_/media`}>
                                <Media
                                    theme={this.props.theme}
                                    node={this.state.node}
                                    match={this.props.match}
                                />
                            </Route>
                            <Route path={`/node${this.state.node.path}/_/timeline`}>
                                <Timeline
                                    theme={this.props.theme}
                                    node={this.state.node}
                                    match={this.props.match}
                                />
                            </Route>
                            <Route path={`/node${this.state.node.path}/_/map`}>
                                <Map
                                    theme={this.props.theme}
                                    node={this.state.node}
                                    match={this.props.match}
                                />
                            </Route>
                            <Route path={`/node${this.state.node.path}/_/family`}>
                                <Family
                                    theme={this.props.theme}
                                    node={this.state.node}
                                    match={this.props.match}
                                />
                            </Route>
                            <Route path={`/node${this.state.node.path}/_/settings`}>
                                <Settings
                                    theme={this.props.theme}
                                    node={this.state.node}
                                    match={this.props.match}
                                />
                            </Route>
                            <Route path="*">
                                <Redirect
                                    to={{
                                        pathname: `/node${this.state.node.path}/_/${pages[0].name}`
                                    }}
                                />
                            </Route>
                        </Switch>
                    </Otherwise>
                </Choose>
            </Container>
        );
    }
}

Node.propTypes = {
    theme: PropTypes.object,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

Node.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Node;
