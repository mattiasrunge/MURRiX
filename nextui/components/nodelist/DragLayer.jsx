
import React from "react";
import { useDragLayer } from "react-dnd";
import DragingItem from "./DraggingItem";
import theme from "./theme.module.css";

const getStyle = (offset) => {
    if (!offset) {
        return {
            display: "none"
        };
    }

    return {
        transform: `translate(${offset.x}px, ${offset.y}px)`
    };
};

const getItems = (item) => {
    if (!item || item.files) {
        return [];
    }

    const selected = item.items.filter(({ selected }) => selected);

    if (!selected.includes(item)) {
        return [ item ];
    }

    return selected;
};

const DragLayer = () => {
    const {
        item,
        isDragging,
        currentOffset
    } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        isDragging: monitor.isDragging(),
        currentOffset: monitor.getClientOffset()
    }));

    const items = getItems(item);

    if (!isDragging || items.length === 0) {
        return null;
    }

    return (
        <div className={theme.dragLayer}>
            <div style={getStyle(currentOffset)}>
                <DragingItem
                    items={getItems(item)}
                />
            </div>
        </div>
    );
};

export default DragLayer;
