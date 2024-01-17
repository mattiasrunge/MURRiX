
import React from "react";
import PropTypes from "prop-types";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import utils from "lib/utils";
import theme from "./theme.module.css";

const DragItem = (props) => {
    const [
        { isDragging },
        dragRef,
        preview
    ] = useDrag({
        item: props.item,
        // options: {
        //     dropEffect: "copy"
        // },
        // canDrag: () => props.item.selected,
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    // Don't show default drag image
    React.useEffect(() => {
        preview(getEmptyImage(), {
            captureDraggingState: true
        });
    }, []);

    return (
        <div
            style={{ ...props.style }}
            ref={dragRef}
            className={utils.classNames([
                theme.dragItem,
                isDragging ? theme.dragItemActive : null
            ])}
        >
            {props.children}
        </div>
    );
};

DragItem.propTypes = {
    item: PropTypes.object.isRequired,
    style: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired
};

export default DragItem;
