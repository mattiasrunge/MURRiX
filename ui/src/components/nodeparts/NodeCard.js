
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Card } from "semantic-ui-react";
import Component from "lib/component";
import NodeImage from "./NodeImage";
import NodeIcon from "./NodeIcon";
import NodeLabels from "./NodeLabels";
import theme from "./theme.module.css";

class NodeCard extends Component {
    onClick = () => {
        this.props.history.push(`/node${this.props.node.path}`);
    }

    render() {
        return (
            <Card onClick={this.onClick}>
                <div className={theme.nodeCardImageContainer}>
                    <NodeImage
                        path={`${this.props.node.path}/profilePicture`}
                        fluid
                        format={{
                            width: 216,
                            height: 216,
                            type: "image"
                        }}
                    />
                </div>
                <Card.Content>
                    <Card.Header className={theme.nodeCardName}>
                        <NodeIcon
                            theme={theme}
                            type={this.props.node.properties.type}
                        />
                        {this.props.node.attributes.name}
                    </Card.Header>
                    <Card.Description className={theme.nodeCardDescription}>
                        <Choose>
                            <When condition={this.props.node.attributes.description && this.props.node.attributes.description.length > 150}>
                                {this.props.node.attributes.description.slice(0, 150).trim()}...
                            </When>
                            <Otherwise>
                                {this.props.node.attributes.description}
                            </Otherwise>
                        </Choose>
                    </Card.Description>
                    <Card.Meta className={theme.nodeCardTags}>
                        <NodeLabels
                            node={this.props.node}
                            history={this.props.history}
                            clickable={false}
                            detailed={false}
                            size="tiny"
                            labelClassName={theme.nodeCardLabel}
                        />
                    </Card.Meta>
                </Card.Content>
            </Card>
        );
    }
}

NodeCard.propTypes = {
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(NodeCard);
