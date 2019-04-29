
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Menu } from "semantic-ui-react";
import NodeImage from "./NodeImage";
import NodeLabels from "./NodeLabels";
import NodeAge from "./NodeAge";

class NodeHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: null,
            loading: false
        };
    }

    async load() {
        this.addDisposables([
            api.vfs.on("node.create", (path) => {
                if (path === `${this.props.node.path}/profilePicture`) {
                    this.update(this.props);
                }
            }),
            api.vfs.on("node.update", (path) => {
                if (path === `${this.props.node.path}/profilePicture`) {
                    this.update(this.props);
                }
            })
        ]);

        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.node.path !== prevProps.node.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ url: null, age: {}, loading: true });

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

    render() {
        return (
            <div className={this.props.theme.nodeHeader}>
                <div
                    className={this.props.theme.nodeHeaderBackground}
                    style={{
                        backgroundImage: `url('${this.state.url}')`
                    }}
                />
                <div className={this.props.theme.nodeHeaderBackgroundGradient} />
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
                    node={this.props.node}
                />
                <div className={this.props.theme.nodeHeaderInformation}>

                </div>
                <div className={this.props.theme.nodeHeaderText}>
                    <div className={this.props.theme.nodeHeaderDetails}>
                        <NodeAge
                            theme={this.props.theme}
                            node={this.props.node}
                        />
                    </div>
                    <div className={this.props.theme.nodeHeaderTitle}>
                        {this.props.node.attributes.name}
                    </div>
                    <div className={this.props.theme.nodeHeaderDescription}>
                        {this.props.node.attributes.description}
                    </div>
                </div>
                <div
                    className={this.props.theme.nodeHeaderTabContainer}
                >
                    <Menu
                        className={this.props.theme.nodeHeaderTabs}
                        tabular
                        borderless
                        size="small"
                    >
                        <For each="page" of={this.props.pages}>
                            <If condition={!page.right}>
                                <Menu.Item
                                    key={page.name}
                                    active={page.active}
                                    icon={page.icon}
                                    name={page.name}
                                    content={page.title}
                                    onClick={page.onClick}
                                />
                            </If>
                        </For>
                        <Menu.Menu position="right">
                            <For each="page" of={this.props.pages}>
                                <If condition={page.right}>
                                    <Menu.Item
                                        key={page.name}
                                        active={page.active}
                                        icon={page.icon}
                                        name={page.name}
                                        content={page.title}
                                        onClick={page.onClick}
                                    />
                                </If>
                            </For>
                        </Menu.Menu>
                    </Menu>
                </div>
            </div>
        );
    }
}

NodeHeader.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    pages: PropTypes.array.isRequired
};

export default NodeHeader;
