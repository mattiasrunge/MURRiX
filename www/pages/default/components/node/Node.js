
/* global URLSearchParams */

import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import ui from "lib/ui";
import notification from "lib/notification";
import { Container, Loader } from "semantic-ui-react";
import { NodeHeader } from "components/nodeparts";
import Media from "./pages/Media";
import Organize from "./pages/Organize";
import Share from "./pages/Share";
import Upload from "./pages/Upload";
import Map from "./pages/Map";
import Family from "./pages/Family";
import Edit from "./pages/Edit";

class Node extends Component {
    constructor(props) {
        super(props);

        this.state = {
            node: false,
            loading: false
        };
    }

    async load() {
        this.setFromMatch(this.props.match);
    }

    componentWillReceiveProps(nextProps) {
        this.setFromMatch(nextProps.match);
    }

    async setFromMatch(match) {
        const path = `/${match.params[0]}`;

        if (this.state.node && this.state.node.path === path) {
            return;
        }

        this.setState({ loading: true, node: false });

        try {
            const node = await api.vfs.resolve(path);

            this.setState({ node, loading: false });
        } catch (error) {
            this.logError("Failed to load node", error);
            notification.add("error", error.message, 10000);
            this.setState({ node: false, loading: false });
        }
    }

    render() {
        ui.setTitle(this.state.node ? this.state.node.attributes.name : null);

        const pages = [
            {
                name: "media",
                title: "Media",
                icon: "image",
                Component: Media
            },
            {
                name: "map",
                title: "Map",
                icon: "map outline",
                Component: Map
            },
            {
                name: "family",
                title: "Family",
                icon: "sitemap",
                Component: Family
            },
            {
                name: "edit",
                title: "Edit",
                icon: "edit",
                Component: Edit
            },
            {
                name: "upload",
                title: "Upload",
                icon: "upload",
                Component: Upload
            },
            {
                name: "share",
                title: "Share",
                icon: "share alternate",
                Component: Share
            },
            {
                name: "organize",
                title: "Organize",
                icon: "folder open outline",
                Component: Organize
            }
        ];

        const params = new URLSearchParams(this.props.location.search);
        const pageName = params.get("page") || pages[0].name;
        const page = pages.find((page) => page.name === pageName);

        page.active = true;

        return (
            <Container className={this.props.theme.nodeContainer}>
                <Choose>
                    <When condition={this.state.loading}>
                        <Loader active>Loading...</Loader>
                    </When>
                    <When condition={!this.state.node}>
                        Nothing loaded!
                    </When>
                    <Otherwise>
                        <NodeHeader
                            match={this.props.match}
                            node={this.state.node}
                            pages={pages}
                        />
                        <page.Component
                            theme={this.props.theme}
                            match={this.props.match}
                            node={this.state.node}
                        />
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

export default Node;
