
import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { Label } from "semantic-ui-react";
import utils from "lib/utils";
import useLabels from "hooks/useLabels";
import theme from "./theme.module.css";

const NodeLabels = ({ className, node, clickable, detailed, size, labelClassName }) => {
    const [ labels ] = useLabels(node.path);

    return (
        <div className={className}>
            <For each="label" of={labels}>
                <Link
                    href={`/home/label/${label.name}`}
                    key={label.name}
                    passHref
                >
                    <Label
                        as="a"
                        className={utils.classNames(theme.nodeCardLabel, labelClassName)}
                        content={label.name}
                        detail={detailed ? label.count : null}
                        color="blue"
                        size={size}
                        image={detailed}
                    />
                </Link>
            </For>
        </div>
    );
};

NodeLabels.defaultProps = {
    size: "small",
    detailed: true,
    labelClassName: theme.labelButton
};

NodeLabels.propTypes = {
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    clickable: PropTypes.bool,
    detailed: PropTypes.bool,
    size: PropTypes.string,
    labelClassName: PropTypes.string
};

export default NodeLabels;
