
import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { Card } from "semantic-ui-react";
import NodeImage from "./NodeImage";
import NodeIcon from "./NodeIcon";
import NodeLabels from "./NodeLabels";
import theme from "./theme.module.css";

const NodeCard = ({ node, className }) => (
    <Link href={`/node${node.path}`} passHref>
        <Card as="a" className={className}>
            <div className={theme.nodeCardImageContainer}>
                <NodeImage
                    path={`${node.path}/profilePicture`}
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
                        type={node.properties.type}
                    />
                    {node.attributes.name}
                </Card.Header>
                <Card.Description className={theme.nodeCardDescription}>
                    <Choose>
                        <When condition={node.attributes.description && node.attributes.description.length > 150}>
                            {node.attributes.description.slice(0, 150).trim()}...
                        </When>
                        <Otherwise>
                            {node.attributes.description}
                        </Otherwise>
                    </Choose>
                </Card.Description>
                <Card.Meta className={theme.nodeCardTags}>
                    <NodeLabels
                        node={node}
                        clickable={false}
                        detailed={false}
                        size="tiny"
                        labelClassName={theme.nodeCardLabel}
                    />
                </Card.Meta>
            </Card.Content>
        </Card>
    </Link>
);

NodeCard.propTypes = {
    className: PropTypes.string,
    node: PropTypes.object.isRequired
};

export default NodeCard;
