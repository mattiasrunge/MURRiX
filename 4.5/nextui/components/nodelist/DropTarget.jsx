
import React from "react";
import PropTypes from "prop-types";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import utils from "lib/utils";
import useActiveList from "hooks/useActiveList";
import theme from "./theme.module.css";

const DropTarget = ({ onDrop, accept, name, children }) => {
    const [ { targetName }, { setTargetName } ] = useActiveList();
    const [ { isOver }, dropRef ] = useDrop({
        accept: [ NativeTypes.FILE, ...accept ],
        drop: (item) => {
            onDrop(item, name);
        },
        canDrop: () => !!onDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver() && monitor.canDrop()
        })
    });

    const onClick = React.useCallback(() => {
        setTargetName(name);
    }, [ name, setTargetName ]);

    return (
        <div
            ref={dropRef}
            onClick={onClick}
            className={utils.classNames(
                theme.dropTarget,
                isOver ? theme.dropTargetActive : null,
                targetName === name ? theme.dropTargetSelected : null
            )}
        >
            {children}
        </div>
    );
};

DropTarget.propTypes = {
    onDrop: PropTypes.func,
    accept: PropTypes.array.isRequired,
    name: PropTypes.any,
    children: PropTypes.node.isRequired
};

export default DropTarget;
