
import React from "react";
import PropTypes from "prop-types";
import { Menu } from "semantic-ui-react";
import Component from "lib/component";
import { backend, cmd, event } from "lib/backend";
import NodeImage from "./NodeImage";
import NodeLabels from "./NodeLabels";
import NodeAge from "./NodeAge";
import theme from "./theme.module.css";

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
            event.on("node.create", this.onNodeUpdated),
            event.on("node.update", this.onNodeUpdated)
        ]);

        await this.update(this.props);
    }

    onNodeUpdated = (event, path) => {
        if (path === `${this.props.node.path}/profilePicture`) {
            this.update(this.props);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.node.path !== prevProps.node.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ url: null, age: {}, loading: true });

        try {
            const url = await cmd.url(`${props.node.path}/profilePicture`, {
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
        const url = this.state.url ? `${backend.getAddress()}${this.state.url}` : "/pixel.jpg";

        return (
            <div className={theme.nodeHeader}>
                <div
                    className={theme.nodeHeaderBackground}
                    style={{
                        backgroundImage: `url('${url}')`
                    }}
                />
                <div className={theme.nodeHeaderBackgroundGradient} />
                <NodeImage
                    theme={theme}
                    className={theme.nodeHeaderImage}
                    path={`${this.props.node.path}/profilePicture`}
                    format={{
                        width: 150,
                        height: 150,
                        type: "image"
                    }}
                />
                <NodeLabels
                    theme={theme}
                    className={theme.nodeHeaderLabels}
                    node={this.props.node}
                />
                <div className={theme.nodeHeaderInformation}>

                </div>
                <div className={theme.nodeHeaderText}>
                    <div className={theme.nodeHeaderDetails}>
                        <NodeAge
                            theme={theme}
                            node={this.props.node}
                        />
                    </div>
                    <div className={theme.nodeHeaderTitle}>
                        {this.props.node.attributes.name}
                    </div>
                    <div className={theme.nodeHeaderDescription}>
                        {this.props.node.attributes.description}
                    </div>
                </div>
                <div
                    className={theme.nodeHeaderTabContainer}
                >
                    <Menu
                        className={theme.nodeHeaderTabs}
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
    node: PropTypes.object.isRequired,
    pages: PropTypes.array.isRequired
};

export default NodeHeader;
