
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Card } from "semantic-ui-react";
import NodeProfilePicture from "./NodeProfilePicture";
import NodeIcon from "./NodeIcon";

class NodeCard extends Component {
    onClick() {
        this.context.router.history.push(`/node${this.props.node.path}`);
    }

    render() {
        return (
            <Card onClick={() => this.onClick()}>
                <NodeProfilePicture
                    theme={this.props.theme}
                    path={`${this.props.node.path}/profilePicture`}
                    format={{
                        width: 300,
                        height: 300,
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
                    <Card.Description>
                        <Choose>
                            <When condition={this.props.node.attributes.description.length > 50}>
                                {this.props.node.attributes.description.substr(0, 50).trim()}...
                            </When>
                            <Otherwise>
                                {this.props.node.attributes.description}
                            </Otherwise>
                        </Choose>
                    </Card.Description>
                </Card.Content>
            </Card>
        );
    }
}

NodeCard.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    node: PropTypes.object.isRequired
};

NodeCard.contextTypes = {
    router: PropTypes.object.isRequired
};

export default NodeCard;
