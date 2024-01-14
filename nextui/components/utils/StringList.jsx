
import React from "react";
import PropTypes from "prop-types";

const StringList = ({ children }) => (
    <>
        <For each="child" index="index" of={children}>
            {child}
            <Choose>
                <When condition={index < children.length - 2}>
                    {", "}
                </When>
                <When condition={index < children.length - 1}>
                    {" and "}
                </When>
            </Choose>
        </For>
    </>
);

StringList.propTypes = {
    children: PropTypes.node
};

export default StringList;
