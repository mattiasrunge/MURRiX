
import React from "react";
import PropTypes from "prop-types";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import useActiveList from "hooks/useActiveList";
import utils from "lib/utils";
import theme from "./theme.module.css";

const DropTarget = (props) => {
    const [ { targetName }, { setTargetName } ] = useActiveList();
    const [ { isOver }, dropRef ] = useDrop({
        accept: [ NativeTypes.FILE, ...props.accept ],
        drop: (item) => {
            props.onDrop(item, props.name);
        },
        canDrop: () => !!props.onDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver() && monitor.canDrop()
        })
    });

    const onClick = React.useCallback(() => {
        setTargetName(props.name);
    }, [ props.name ]);

    return (
        <div
            ref={dropRef}
            onClick={onClick}
            className={utils.classNames(
                theme.dropTarget,
                isOver ? theme.dropTargetActive : null,
                targetName === props.name ? theme.dropTargetSelected : null
            )}
        >
            {props.children}
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
