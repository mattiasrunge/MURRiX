
import React from "react";
import PropTypes from "prop-types";
import { List } from "semantic-ui-react";
import Component from "lib/component";
import { NodeLink } from "components/nodeparts";
import { StringList } from "components/utils";
import { cmd } from "lib/backend";
import theme from "../theme.module.css";

class Device extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            device: false,
            deviceOwners: []
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
            const device = await cmd.resolve(`${props.node.path}/createdWith`, { noerror: true });

            const deviceOwners = await cmd.list(`${props.node.path}/createdWith/owners`, { noerror: true });

            !this.disposed && this.setState({
                device,
                deviceOwners,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load device information", error, 10000);
            !this.disposed && this.setState({
                device: false,
                deviceOwners: [],
                loading: false
            });
        }
    }

    render() {
        return (
            <If condition={this.state.device}>
                <List.Item>
                    <List.Icon size="big" name="camera retro" />
                    <List.Content>
                        <NodeLink
                            node={this.state.device}
                        />
                        <If condition={this.state.deviceOwners.length > 0}>
                            <div className={theme.sidebarListSecondary}>
                                {"Owned by "}
                                <StringList>
                                    <For each="owner" of={this.state.deviceOwners}>
                                        <NodeLink
                                            key={owner.path}
                                            node={owner}
                                        />
                                    </For>
                                </StringList>
                            </div>
                        </If>
                    </List.Content>
                </List.Item>
            </If>
        );
    }
}

Device.propTypes = {
    node: PropTypes.object.isRequired
};

export default Device;
