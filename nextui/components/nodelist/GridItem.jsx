
import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import utils from "lib/utils";
import { NodeImage } from "components/nodeparts";
import DragItem from "./DragItem";
import theme from "./theme.module.css";

const GridItem = ({ rowIndex, columnIndex, data, style }) => {
    const item = data.getItem(rowIndex, columnIndex);
    const padding = item.selected ? 7 : 1;
    const size = data.size - (padding * 2);

    const onClick = React.useCallback((e) => {
        data.selectItem(e, item);
    }, [ data, item ]);

    if (!item) {
        return null;
    }

    return (
        <DragItem
            item={item}
            style={style}
        >
            <span
                className={utils.classNames(
                    theme.gridItem,
                    item.selected ? theme.gridItemSelected : null
                )}
                onClick={onClick}
            >
                <NodeImage
                    className={theme.gridItemImage}
                    title={item.node.attributes.name}
                    path={item.node.path}
                    format={{
                        width: data.size > 50 ? 216 : 50,
                        height: data.size > 50 ? 216 : 50,
                        type: "image"
                    }}
                    noFixedSize
                    style={{
                        width: `${size}px`,
                        height: `${size}px`
                    }}
                />
                <If condition={item.node.attributes.type === "video"}>
                    <div
                        className={theme.gridItemType}
                        style={{
                            fontSize: data.size > 50 ? "28px" : "14px"
                        }}
                    >
                        <Icon name="film" />
                    </div>
                </If>
                <If condition={item.node.attributes.type === "audio"}>
                    <div
                        className={theme.gridItemType}
                        style={{
                            fontSize: data.size > 50 ? "28px" : "14px"
                        }}
                    >
                        <Icon name="sound" />
                    </div>
                </If>
                <div className={theme.gridItemSelectedCover}></div>
            </span>
        </DragItem>
    );
};

GridItem.propTypes = {
    rowIndex: PropTypes.number.isRequired,
    columnIndex: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired,
    style: PropTypes.object.isRequired
};

export default GridItem;
