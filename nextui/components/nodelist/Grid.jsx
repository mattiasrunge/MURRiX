
import React from "react";
import PropTypes from "prop-types";
import { FixedSizeGrid } from "react-window";
import GridItem from "./GridItem";

const itemKey = ({ rowIndex, columnIndex, data }) => data.getItem(rowIndex, columnIndex)?.id ?? `${rowIndex}_${columnIndex}`;

const Grid = ({ itemSize, width, height, items, onSelect }) => {
    const columnCount = Math.floor(width / itemSize);
    const rowCount = Math.ceil(items.length / columnCount);

    const getItem = React.useCallback((row, column) => {
        const index = (row * columnCount) + column;

        return items[index];
    }, [ items, columnCount ]);

    return (
        <FixedSizeGrid
            columnCount={columnCount}
            rowCount={rowCount}
            columnWidth={itemSize}
            rowHeight={itemSize}
            width={width}
            height={height}
            itemData={{
                getItem,
                selectItem: onSelect,
                size: itemSize
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
