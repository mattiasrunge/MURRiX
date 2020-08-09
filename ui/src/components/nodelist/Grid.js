
import React from "react";
import PropTypes from "prop-types";
import { FixedSizeGrid } from "react-window";
import GridItem from "./GridItem";

const itemKey = ({ rowIndex, columnIndex, data }) => data.getItem(rowIndex, columnIndex)?.id ?? `${rowIndex}_${columnIndex}`;

const Grid = (props) => {
    const columnCount = Math.floor(props.width / props.itemSize);
    const rowCount = Math.ceil(props.items.length / columnCount);

    const getItem = React.useCallback((row, column) => {
        const index = (row * columnCount) + column;

        return props.items[index];
    }, [ props.items, columnCount ]);

    return (
        <FixedSizeGrid
            columnCount={columnCount}
            rowCount={rowCount}
            columnWidth={props.itemSize}
            rowHeight={props.itemSize}
            width={props.width}
            height={props.height}
            itemData={{
                getItem,
                selectItem: props.onSelect,
                size: props.itemSize
            }}
            itemKey={itemKey}
        >
            {GridItem}
        </FixedSizeGrid>
    );
};

Grid.propTypes = {
    itemSize: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    items: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default Grid;
