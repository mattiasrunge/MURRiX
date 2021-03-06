
import React from "react";
import PropTypes from "prop-types";
import { Table } from "semantic-ui-react";
import Component from "lib/component";
import format from "lib/format";
import FileIcon from "./FileIcon";
import FileStatus from "./FileStatus";
import theme from "../theme.module.css";

class FileList extends Component {
    render() {
        return (
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
                            style={{
                                width: 120
                            }}
                        >
                            Status
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <For each="file" of={this.props.files}>
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
                            <Table.Cell verticalAlign="middle" style={{
                                width: 120
                            }}>
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
    }
}

FileList.propTypes = {
    files: PropTypes.array.isRequired
};

export default FileList;
