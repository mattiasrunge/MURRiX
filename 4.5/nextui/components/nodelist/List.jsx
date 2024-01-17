/* eslint-disable react/prop-types */

import React from "react";
import PropTypes from "prop-types";
import AutoSizer from "react-virtualized-auto-sizer";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ui from "lib/ui";
import useNodeList from "hooks/useNodeList";
import useActiveList from "hooks/useActiveList";
import DragLayer from "./DragLayer";
import DropTarget from "./DropTarget";
import Grid from "./Grid";
import Toolbar from "./Toolbar";

const List = ({ accept, onDrop, onDelete, onUpload, onNode, node }) => {
    const [ { targetName } ] = useActiveList();
    const [ type, setType ] = React.useState("grid_large");
    const [ filter, setFilter ] = React.useState(null);
    const [ items, setItems ] = React.useState([]);
    const [ nodes ] = useNodeList(node ? `${node.path}/files` : null);

    React.useEffect(() => {
        const list = nodes.map((node) => ({
            type: node.properties.type,
            name: node.name,
            id: node._id,
            node,
            selected: false
        }));

        for (const item of list) { item.items = list; }

        if (!filter) {
            setItems(list);
        } else {
            const notMatched = list.filter(({ node }) => node.attributes.type !== filter);
            const matched = list.filter(({ node }) => node.attributes.type === filter);

            for (const item of notMatched) { item.selected = false; }

            setItems(matched);
        }
    }, [ nodes, filter ]);

    const onDropHandler = React.useCallback((item, name) => {
        if (item.files) {
            return onUpload(name, item.files);
        }

        const selected = item.items.filter(({ selected }) => selected);

        if (!selected.includes(item)) {
            onDrop(name, [ item.node ]);
        } else {
            onDrop(name, selected.map(({ node }) => node));
        }
    }, [ onDrop, onUpload ]);

    const onSelect = React.useCallback((e, item) => {
        const isSelected = item.selected;
        const itemsCopy = [ ...items ];

        if (e.ctrlKey) {
            item.selected = !isSelected;
        } else if (e.shiftKey) {
            const selected = items.map(({ selected }) => selected);
            const itemIndex = items.indexOf(item);
            const firstIndex = selected.indexOf(true);
            const lastIndex = selected.lastIndexOf(true);

            for (const item of itemsCopy) { item.selected = false; }

            if (firstIndex === -1 || lastIndex === -1) {
                item.selected = !isSelected;
            } else if (itemIndex === firstIndex) {
                item.selected = !isSelected;
            } else if (itemIndex < firstIndex) {
                for (let index = itemIndex; index <= lastIndex; index++) {
                    itemsCopy[index].selected = true;
                }
            } else {
                for (let index = firstIndex; index <= itemIndex; index++) {
                    itemsCopy[index].selected = true;
                }
            }
        } else {
            const selected = itemsCopy.filter(({ selected }) => selected);
            for (const item of itemsCopy) { item.selected = false; }
            item.selected = selected.length > 1 ? true : !isSelected;
        }

        setItems(itemsCopy);
    }, [ items ]);

    React.useEffect(() => {
        if (targetName !== node?.path) {
            return;
        }

        const disposables = [
            ui.shortcut("del", () => {
                const selected = items.filter(({ selected }) => selected);

                onDelete(node.name, selected.map(({ node }) => node));
            }),
            ui.shortcut("ctrl+a", (e) => {
                e.preventDefault();

                const itemsCopy = [ ...items ];
                for (const item of itemsCopy) { item.selected = true; }
                setItems(itemsCopy);
            }),
            ui.shortcut("escape", () => {
                const itemsCopy = [ ...items ];
                for (const item of itemsCopy) { item.selected = false; }
                setItems(itemsCopy);
            })
        ];

        // eslint-disable-next-line unicorn/no-array-for-each
        return () => disposables.forEach(({ dispose }) => dispose());
    }, [ items, node, onDelete, targetName ]);

    return (
        <DndProvider backend={HTML5Backend}>
            <DragLayer />
            <Toolbar
                type={type}
                onType={setType}
                filter={filter}
                onFilter={setFilter}
                onNode={onNode}
                node={node}
            />
            <If condition={node}>
                <AutoSizer>
                    {({ height, width }) => (
                        <DropTarget
                            accept={accept}
                            onDrop={onDrop ? onDropHandler : null}
                            name={`${node.path}/files`}
                        >
                            <Grid
                                itemSize={type === "grid_large" ? 200 : 50}
                                width={width}
                                height={height - 42}
                                items={items}
                                onSelect={onSelect}
                            />
                        </DropTarget>
                    )}
                </AutoSizer>
            </If>
        </DndProvider>
    );
};

List.defaultProps = {
    accept: []
};

List.propTypes = {
    accept: PropTypes.array,
    onDrop: PropTypes.func,
    onDelete: PropTypes.func,
    onUpload: PropTypes.func,
    onNode: PropTypes.func,
    node: PropTypes.object
};

export default List;

