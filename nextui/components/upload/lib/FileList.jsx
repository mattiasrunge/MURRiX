
import React from "react";
import PropTypes from "prop-types";
import { Table } from "semantic-ui-react";
import format from "lib/format";
import theme from "../theme.module.css";
import FileIcon from "./FileIcon";
import FileStatus from "./FileStatus";

const STYLE = {
    width: 120
};

const FileList = ({ files }) => (
    <Table striped basic="very">
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell>
                    Name
                </Table.HeaderCell>
                <Table.HeaderCell
                    collapsing
                    verticalAlign="middle"
                    textAlign="right"
                >
                    Size
                </Table.HeaderCell>
                <Table.HeaderCell
                    verticalAlign="middle"
                    style={STYLE}
                >
                    Status
                </Table.HeaderCell>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            <For each="file" of={files}>
                <Table.Row key={file.id}>
                    <Table.Cell>
                        <FileIcon
                            theme={theme}
                            type={file.type}
                        />
                        {file.name}
                    </Table.Cell>
                    <Table.Cell collapsing verticalAlign="middle" textAlign="right">
                        {format.size(file.size)}
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" style={STYLE}>
                        <FileStatus
                            theme={theme}
                            status={file.status}
                            error={file.error}
                        />
                    </Table.Cell>
                </Table.Row>
            </For>
        </Table.Body>
    </Table>
);

FileList.propTypes = {
    files: PropTypes.array.isRequired
};

export default FileList;
