
import React from "react";
import PropTypes from "prop-types";
import { Header, Grid, Modal, List } from "semantic-ui-react";
import Component from "lib/component";
import { SelectableImageList } from "components/list";
import { NodeImage } from "components/nodeparts";
import { Viewer } from "components/viewer";
import MoveToList from "../lib/MoveToList";
import theme from "../../theme.module.css";

class Organize extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: [],
            file: false,
            files: [],
            showDuplicates: false
        };
    }

    onSelectedChange = (selected) => {
        this.setState({ selected });
    }

    onView = (file, files) => {
        if (files) {
            this.setState({ file, files });
        } else {
            this.setState({ file });
        }
    }

    onClickDuplicate = (file) => {
        this.setState({ showDuplicates: file });
    }

    onCloseDuplicate = () => {
        this.setState({ showDuplicates: false });
    }

    render() {
        return (
            <div>
                <If condition={this.state.showDuplicates}>
                    <Modal
                        closeIcon
                        defaultOpen
                        onClose={this.onCloseDuplicate}
                    >
                        <Modal.Header>
                            Duplicates of {this.state.showDuplicates.name}
                        </Modal.Header>
                        <Modal.Content image>
                            <NodeImage
                                title={this.state.showDuplicates.name}
                                path={this.state.showDuplicates.path}
                                format={{
                                    width: 216,
                                    height: 216,
                                    type: "image"
                                }}
                            />
                            <Modal.Description>
                                <List>
                                    <For each="path" of={this.state.showDuplicates.extra.duplicates}>
                                        <List.Item key={path}>
                                            {path}
                                        </List.Item>
                                    </For>
                                </List>
                            </Modal.Description>
                        </Modal.Content>
                    </Modal>
                </If>
                <If condition={this.state.file}>
                    <Viewer
                        path={this.state.file.path}
                        onSelect={this.onView}
                        nodes={this.state.files}
                    />
                </If>
                <Header as="h2">
                    Organize
                    <Header.Subheader>
                        Move files to another album
                    </Header.Subheader>
                </Header>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={11}>
                            <SelectableImageList
                                path={`${this.props.node.path}/files`}
                                value={this.state.selected}
                                onChange={this.onSelectedChange}
                                onView={this.onView}
                                showDuplicates={true}
                                onClickDuplicate={this.onClickDuplicate}
                            />
                        </Grid.Column>
                        <Grid.Column width={5}>
                            <MoveToList
                                theme={theme}
                                node={this.props.node}
                                files={this.state.selected}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

Organize.propTypes = {
    node: PropTypes.object.isRequired
};

export default Organize;
