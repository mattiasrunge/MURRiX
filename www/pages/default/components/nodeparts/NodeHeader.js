
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Menu, Header } from "semantic-ui-react";
import NodeImage from "./NodeImage";
import NodeLabels from "./NodeLabels";

class NodeHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: null,
            loading: false
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.node.path !== nextProps.node.path) {
            this.update(nextProps);
        }
    }

    async update(props) {
        this.setState({ url: null, loading: true });

        try {
            const url = await api.vfs.media(`${props.node.path}/profilePicture`, {
                width: 1127,
                height: 350,
                type: "image"
            });

            !this.disposed && this.setState({ url, loading: false });
        } catch (error) {
            // this.logError("Failed to get node url", error, 10000);
            !this.disposed && this.setState({ loading: false });
        }
    }

    onMenuClick = (e, { name }) => {
        this.context.router.history.push(`${this.props.match.url}?page=${name}`);
    }

    render() {
        return (
            <div
                className={this.props.theme.nodeHeader}
            >
                <div
                    className={this.props.theme.nodeHeaderBackground}
                    style={{
                        backgroundImage: `url('${this.state.url}')`
                    }}
                />
                <div
                    className={this.props.theme.nodeHeaderBackgroundGradient}
                />
                <NodeImage
                    theme={this.props.theme}
                    className={this.props.theme.nodeHeaderImage}
                    path={`${this.props.node.path}/profilePicture`}
                    format={{
                        width: 150,
                        height: 150,
                        type: "image"
                    }}
                />
                <NodeLabels
                    theme={this.props.theme}
                    className={this.props.theme.nodeHeaderLabels}
                    path={this.props.node.path}
                />
                <Header
                    className={this.props.theme.nodeHeaderTitle}
                    inverted
                >
                    {this.props.node.attributes.name}
                </Header>
                <div
                    className={this.props.theme.nodeHeaderTabContainer}
                >
                    <Menu
                        className={this.props.theme.nodeHeaderTabs}
                        tabular
                        fluid
                        borderless
                        size="small"
                        widths={this.props.pages.length}
                    >
                        <For each="page" of={this.props.pages}>
                            <Menu.Item
                                key={page.name}
                                active={page.active}
                                icon={page.icon}
                                name={page.name}
                                content={page.title}
                                onClick={this.onMenuClick}
                            />
                        </For>
                    </Menu>
                </div>
            </div>
        );
    }
}

NodeHeader.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    pages: PropTypes.array.isRequired,
    match: PropTypes.object.isRequired
};

NodeHeader.contextTypes = {
    router: PropTypes.object.isRequired
};

export default NodeHeader;
