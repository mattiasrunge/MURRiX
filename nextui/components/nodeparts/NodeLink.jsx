
import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import utils from "lib/utils";
import NodeIcon from "./NodeIcon";
import theme from "./theme.module.css";

const NodeLink = ({ className, node, icon }) => (
    <Link href={`/node${node.path}`}>
        <a className={utils.classNames(theme.nodeLink, className)}>
            <If condition={icon}>
                <NodeIcon
                    type={node.properties.type}
                />
            </If>
            {node.attributes.name}
        </a>
    </Link>
);

NodeLink.propTypes = {
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    icon: PropTypes.bool
};

export default NodeLink;
