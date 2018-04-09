
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import utils from "lib/utils";
import { Icon, Header } from "semantic-ui-react";
import api from "api.io-client";
import { NodeLink } from "components/nodeparts";

class TimelineText extends Component {
    constructor(props) {
        super(props);

        this.state = {
            other: []
        };
    }
    onRemove = () => {
        this.props.onRemove(this.props.node);
    }

    onEdit = () => {
        this.props.onEdit(this.props.node);
    }

    async load() {
        try {
            const nodes = await api.vfs.lookup(this.props.node._id);
            const promises = nodes
            .map((node) => node.path)
            .filter((path) => path !== this.props.node.path)
            .map((path) => utils.dirname(utils.dirname(path)))
            .map((path) => api.vfs.resolve(path));

            const other = await Promise.all(promises);

            !this.disposed && this.setState({
                other: other.filter((node) => node)
            });
        } catch (error) {
        }
    }

    render() {
        return (
            <div className={this.props.theme.text}>
                <Header as="h3">
                    {this.props.node.attributes.name}
                    <span className={this.props.theme.textBy}>
                        <If condition={this.props.onEdit}>
                            <Icon
                                className={this.props.theme.mediaEditIcon}
                                name="edit"
                                title="Edit"
                                link
                                onClick={this.onEdit}
                            />
                        </If>
                        <If condition={this.props.onRemove}>
                            <Icon
                                className={this.props.theme.mediaEditIcon}
                                name="trash"
                                title="Remove"
                                link
                                onClick={this.onRemove}
                            />
                        </If>
                    </span>
                </Header>
                <p>
                    {this.props.node.attributes.text}
                </p>
                <If condition={this.state.other.length > 0}>
                    <div className={this.props.theme.withOthers}>
                        {"- with "}
                        <For each="node" of={this.state.other}>
                            <NodeLink
                                key={node._id}
                                node={node}
                            />
                        </For>
                    </div>
                </If>
            </div>
        );
    }
}

TimelineText.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onRemove: PropTypes.func,
    onEdit: PropTypes.func
};

export default TimelineText;
