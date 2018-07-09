
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { NodeLink } from "components/nodeparts";
import { StringList } from "components/utils";
import api from "api.io-client";

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
            const device = await api.vfs.resolve(`${props.node.path}/createdWith`, { noerror: true });

            const deviceOwners = await api.vfs.list(`${props.node.path}/createdWith/owners`, { noerror: true });

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
            <div>
                <If condition={this.state.device}>
                    <NodeLink
                        node={this.state.device}
                    />
                    <If condition={this.state.deviceOwners.length > 0}>
                        <div className={this.props.theme.sidebarListSecondary}>
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
                </If>
            </div>
        );
    }
}

Device.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default Device;
