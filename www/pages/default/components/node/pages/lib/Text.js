
import React from "react";
import PropTypes from "prop-types";
import format from "lib/format";
import Component from "lib/component";
import { Icon } from "semantic-ui-react";

class Text extends Component {
    onRemove = () => {
        this.props.onRemove(this.props.node);
    }

    onEdit = () => {
        this.props.onEdit(this.props.node);
    }

    render() {
        return (
            <div className={this.props.theme.text}>
                <blockquote>
                    <p>
                        {this.props.node.attributes.text}
                    </p>
                    <div className={this.props.theme.textBy}>
                        Written by <cite title="By">{this.props.node.name}</cite> on {format.datetimeUtc(this.props.node.attributes.time.timestamp)}

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
                    </div>
                </blockquote>
            </div>
        );
    }
}

Text.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onRemove: PropTypes.func,
    onEdit: PropTypes.func
};

export default Text;
