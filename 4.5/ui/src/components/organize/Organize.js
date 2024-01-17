
import React from "react";
import { Button, Modal } from "semantic-ui-react";
import { NotificationManager } from "react-notifications";
import AutoSizer from "react-virtualized-auto-sizer";
import { JobsManager } from "components/jobs";
import { List } from "components/nodelist";
import theme from "./theme.module.css";

const Organize = () => {
    const [ nodesToDelete, setNodesToDelete ] = React.useState([]);
    const [ node1, setNode1 ] = React.useState(null);
    const [ node2, setNode2 ] = React.useState(null);

    const onDrop = React.useCallback(async (path, nodes) => {
        const nodesToMove = nodes.filter((node) => !node.path.startsWith(path));

        if (nodesToMove.length > 0) {
            JobsManager.create("move", nodesToMove, path);
        }
    }, []);

    const onUpload = React.useCallback(async (path, files) => {
        JobsManager.create("upload", files, path);
    });

    const onDelete = React.useCallback((path, nodes) => {
        setNodesToDelete(nodes);
    }, [ setNodesToDelete ]);

    const onDeleteCancel = React.useCallback((e) => {
        e && e.stopPropagation();

        setNodesToDelete([]);
    }, [ setNodesToDelete ]);

    const onDeleteExecute = React.useCallback(async () => {
        const nodes = nodesToDelete.slice(0);
        setNodesToDelete([]);

        JobsManager.create("delete", nodes);
    }, [ setNodesToDelete, nodesToDelete ]);
console.log("1", node1)
console.log("2", node2)
    return (
        <>
            <If condition={nodesToDelete.length > 0}>
                <Modal
                    size="mini"
                    defaultOpen
                    onClose={onDeleteCancel}
                >
                    <Modal.Content>
                        <p>
                            <strong>
                                Delete {nodesToDelete.length} node{nodesToDelete.length > 1 ? "s" : ""} permanently?
                            </strong>
                        </p>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            onClick={onDeleteCancel}
                            content="Cancel"
                        />
                        <Button
                            negative
                            icon="trash"
                            content="Delete"
                            onClick={onDeleteExecute}
                        />
                    </Modal.Actions>
                </Modal>
            </If>
            <AutoSizer>
                {({ height, width }) => (
                    <div style={{
                        width: `${width}px`,
                        height: `${height}px`
                    }}>
                        <div className={theme.row}>
                            <div className={theme.column}>
                                <List
                                    accept={[ "f" ]}
                                    node={node1}
                                    onNode={setNode1}
                                    onDrop={onDrop}
                                    onDelete={onDelete}
                                    onUpload={onUpload}
                                />
                            </div>
                            <div className={theme.column}>
                                <List
                                    accept={[ "f" ]}
                                    node={node2}
                                    onNode={setNode2}
                                    onDrop={onDrop}
                                    onDelete={onDelete}
                                    onUpload={onUpload}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </AutoSizer>
        </>
    );
};

export default Organize;
