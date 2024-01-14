
import React from "react";
import PropTypes from "prop-types";
import { Icon, Header } from "semantic-ui-react";
import Component from "lib/component";
import utils from "lib/utils";
import { api } from "lib/backend";
import { NodeLink } from "components/nodeparts";
import theme from "../../theme.module.css";

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
            const nodes = await api.lookup(this.props.node._id);
            const promises = nodes
            .map((node) => node.path)
            .filter((path) => path !== this.props.node.path)
            .map((path) => utils.dirname(utils.dirname(path)))
            .map((path) => api.resolve(path));

            const other = await Promise.all(promises);

            !this.disposed && this.setState({
                other: other.filter((node) => node)
            });
        } catch {}
    }

    render() {
        return (
            <div className={theme.text}>
                <Header as="h3">
                    {this.props.node.attributes.name}
                    <span className={theme.textBy}>
                        <If condition={this.props.onEdit}>
                            <Icon
                                className={theme.mediaEditIcon}
                                name="edit"
                                title="Edit"
                                link
                                onClick={this.onEdit}
                            />
                        </If>
                        <If condition={this.props.onRemove}>
                            <Icon
                                className={theme.mediaEditIcon}
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
                    <div className={theme.withOthers}>
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
    node: PropTypes.object.isRequired,
    onRemove: PropTypes.func,
    onEdit: PropTypes.func
};

export default TimelineText;
