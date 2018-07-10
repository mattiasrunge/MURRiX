
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
import Tags from "./pages/Tags";
import Details from "./pages/Details";

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

    componentDidUpdate(prevProps) {
        if (prevProps.match !== this.props.match) {
            this.setFromMatch(this.props.match);
        }
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

        const allPages = [
            {
                name: "media",
                title: "Media",
                icon: "image",
                active: this.state.page === "media",
                onClick: this.onPage,
                Component: Media,
                validTypes: [ "a" ]
            },
            {
                name: "timeline",
                title: "Timeline",
                icon: "time",
                active: this.state.page === "timeline",
                onClick: this.onPage,
                Component: Timeline,
                validTypes: [ "p" ]
            },
            {
                name: "details",
                title: "Details",
                icon: "address card outline",
                active: this.state.page === "details",
                onClick: this.onPage,
                Component: Details,
                validTypes: [ "p" ]
            },
            {
                name: "tags",
                title: "Tags",
                icon: "image",
                active: this.state.page === "tags",
                onClick: this.onPage,
                Component: Tags,
                validTypes: [ "p" ]
            },
            {
                name: "map",
                title: "Map",
                icon: "map outline",
                active: this.state.page === "map",
                onClick: this.onPage,
                Component: Map,
                validTypes: [ "l" ]
            },
            {
                name: "family",
                title: "Family",
                icon: "sitemap",
                active: this.state.page === "family",
                onClick: this.onPage,
                Component: Family,
                validTypes: [ "p" ]
            }
        ];

        if (this.state.node.editable) {
            allPages.push({
                name: "settings",
                title: "Settings",
                icon: "setting",
                active: this.state.page === "settings",
                onClick: this.onPage,
                Component: Settings,
                validTypes: [ "p", "c", "l", "a" ],
                right: true
            });
        }

        const pages = allPages.filter((page) => this.state.node && page.validTypes.includes(this.state.node.properties.type));

        return (
            <Container className={this.props.theme.nodeContainer}>
                <Choose>
                    <When condition={!this.state.node}>
                        Nothing loaded!
                    </When>
                    <Otherwise>
                        <NodeHeader
                            key={this.state.node._id}
                            node={this.state.node}
                            pages={pages}
                        />
                        <Switch>
                            <For each="page" of={pages}>
                                <Route
                                    key={page.name}
                                    path={`/node${this.state.node.path}/_/${page.name}`}
                                >
                                    <// eslint-disable-next-line
                                     page.Component
                                        key={this.state.node._id}
                                        theme={this.props.theme}
                                        node={this.state.node}
                                        match={this.props.match}
                                    />
                                </Route>
                            </For>
                            <If condition={this.state.node}>
                                <Route path="*">
                                    <Redirect
                                        to={{
                                            pathname: `/node${this.state.node.path}/_/${pages[0].name}`
                                        }}
                                    />
                                </Route>
                            </If>
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
