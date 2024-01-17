
import React from "react";
import PropTypes from "prop-types";
import { NodeImage } from "components/nodeparts";
import theme from "./theme.module.css";

const width = 50;
const height = 50;
const offset = 5;
const limit = 6;
const rotation = 5;

const DraggingItem = (props) => {
    const selected = props.items.slice(0, limit).reverse();
    const len = selected.length;

    return (
        <div className={theme.draggingItem}>
            <For each="item" index="index" of={selected}>
                <div
                    key={item.id}
                    className={theme.draggingItemImageContainer}
                    style={{
                        top: -22,
                        left: ((len - index - 1) * offset) - 8,
                        width,
                        height,
                        opacity: (index + 1) / len,
                        transform: `rotate(${(len - index - 1) * rotation}deg)`,
                        transformOrigin: "bottom left"
                    }}
                >
                    <NodeImage
                        className={theme.draggingItemImage}
                        inline
                        path={item.node.path}
                        format={{
                            width,
                            height,
                            type: "image"
                        }}
                        rounded
                        bordered
                    />
                </div>
            </For>
            <div className={theme.draggingItemCount}>{props.items.length.toString()}</div>
        </div>
    );
};

DraggingItem.propTypes = {
    items: PropTypes.array.isRequired
};

export default DraggingItem;
