
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { List } from "semantic-ui-react";
import { NodeLink } from "components/nodeparts";
import api from "api.io-client";

class ParentNode extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            parent: false
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
            const parent = await api.vfs.resolve(`${props.node.path}/../..`, { noerror: true });

            !this.disposed && this.setState({
                parent,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load parent node", error, 10000);
            !this.disposed && this.setState({
                parent: false,
                loading: false
            });
        }
    }

    render() {
        return (
            <If condition={this.state.parent}>
                <List.Item>
                    <List.Icon size="big" name="book" />
                    <List.Content>
                        <NodeLink node={this.state.parent} />
                    </List.Content>
                </List.Item>
            </If>
        );
    }
}

ParentNode.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default ParentNode;
