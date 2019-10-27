
import React from "react";
import { Progress, Table } from "semantic-ui-react";
import Component from "lib/component";
import uploader from "lib/uploader";
import theme from "./theme.module.css";

class UploadProgress extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...uploader.getState()
        };
    }

    async load() {
        this.addDisposable(uploader.on("state", (name, state) => this.setState(state)));
    }

    render() {
        if (!this.state.ongoing) {
            return null;
        }

        const total = this.state.files.length;
        const current = this.state.files.indexOf(this.state.currentFile) + 1;

        return (
            <div className={theme.uploadProgress}>
                <Table compact="very" basic attached="top">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell
                                colSpan="2"
                                className={theme.uploadProgressTitle}
                            >
                                Uploading {this.state.currentFile.name}...
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
                                    value={this.state.progress}
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
    }
}

export default UploadProgress;
