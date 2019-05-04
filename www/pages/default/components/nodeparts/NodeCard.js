
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { withRouter } from "react-router-dom";
import { Card, Label } from "semantic-ui-react";
import NodeImage from "./NodeImage";
import NodeIcon from "./NodeIcon";

class NodeCard extends Component {
    onClick = () => {
        this.props.history.push(`/node${this.props.node.path}`);
    }

    render() {
        return (
            <Card onClick={this.onClick}>
                <NodeImage
                    theme={this.props.theme}
                    path={`${this.props.node.path}/profilePicture`}
                    fluid
                    format={{
                        width: 216,
                        height: 216,
                        type: "image"
                    }}
                />
                <Card.Content>
                    <Card.Header>
                        <NodeIcon
                            theme={this.props.theme}
                            type={this.props.node.properties.type}
                        />
                        {this.props.node.attributes.name}
                    </Card.Header>
                    <Card.Description
                        className={this.props.theme.nodeCardDescription}
                    >
                        <Choose>
                            <When condition={this.props.node.attributes.description && this.props.node.attributes.description.length > 150}>
                                {this.props.node.attributes.description.substr(0, 150).trim()}...
                            </When>
                            <Otherwise>
                                {this.props.node.attributes.description}
                            </Otherwise>
                        </Choose>
                    </Card.Description>
                    <If condition={this.props.node.attributes.labels.length > 0}>
                        <Card.Meta
                            className={this.props.theme.nodeCardTags}
                        >
                            <For each="label" of={this.props.node.attributes.labels}>
                                <Label
                                    key={label}
                                    className={this.props.theme.nodeCardLabel}
                                    color="blue"
                                    content={label}
                                    size="tiny"
                                />
                            </For>
                        </Card.Meta>
                    </If>
                </Card.Content>
            </Card>
        );
    }
}

NodeCard.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(NodeCard);
