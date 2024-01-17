
import React from "react";
import { Progress, Table } from "semantic-ui-react";
import useUploaderState from "hooks/useUploaderState";
import theme from "./theme.module.css";

const UploadProgress = () => {
    const uploaderState = useUploaderState();

    if (!uploaderState.ongoing) {
        return null;
    }

    const total = uploaderState.files.length;
    const current = uploaderState.files.indexOf(uploaderState.currentFile) + 1;

    return (
        <div className={theme.uploadProgress}>
            <Table compact="very" basic attached="top">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell
                            colSpan="2"
                            className={theme.uploadProgressTitle}
                        >
                            Uploading {uploaderState.currentFile.name}...
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    <Table.Row>
                        <Table.Cell collapsing>Total</Table.Cell>
                        <Table.Cell>
                            <Progress
                                style={{ margin: 0 }}
                                active
                                color="blue"
                                value={current}
                                total={total}
                                progress="ratio"
                                precision={0}
                            />
                        </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell collapsing>Current</Table.Cell>
                        <Table.Cell>
                            <Progress
                                style={{ margin: 0 }}
                                active
                                color="blue"
                                value={uploaderState.progress}
                                total={100}
                                progress="percent"
                                precision={0}
                            />
                        </Table.Cell>
                    </Table.Row>

                </Table.Body>
            </Table>
        </div>
    );
};

export default UploadProgress;
