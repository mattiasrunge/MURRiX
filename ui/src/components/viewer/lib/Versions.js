
import React from "react";
import PropTypes from "prop-types";
import { List } from "semantic-ui-react";
import Component from "lib/component";
import format from "lib/format";
import { cmd } from "lib/backend";
import theme from "../theme.module.css";

class Versions extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            versions: []
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.node !== prevProps.node) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const versions = await cmd.list(`${props.node.path}/versions`, { noerror: true });

            !this.disposed && this.setState({
                versions,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load version information", error, 10000);
            !this.disposed && this.setState({
                versions: [],
                loading: false
            });
        }
    }

    render() {
        return (
            <List.Item>
                <List.Icon size="big" name="download" />
                <List.Content>
                    <a
                        href={`/media/file/${this.props.node.attributes.diskfilename}/${this.props.node.attributes.name}`}
                    >
                        {this.props.node.attributes.name}
                    </a>
                    {" "}
                    <small>
                        ({format.size(this.props.node.attributes.size)})
                    </small>
                    <If condition={this.state.versions.length > 0}>
                        <List className={theme.sidebarListSecondary}>
                            <For each="version" of={this.state.versions}>
                                <List.Item key={version.path}>
                                    <a
                                        href={`/media/file/${version.attributes.diskfilename}/${version.attributes.name}`}
                                    >
                                        {version.attributes.name}
                                    </a>
                                    {" "}
                                    ({format.size(version.attributes.size)})
                                </List.Item>
                            </For>
                        </List>
                    </If>
                </List.Content>
            </List.Item>
        );
    }
}

Versions.propTypes = {
    node: PropTypes.object.isRequired
};

export default Versions;
