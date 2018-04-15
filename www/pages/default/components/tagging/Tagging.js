
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header, Grid, Button, Container } from "semantic-ui-react";
import { SelectableImageList } from "components/list";
import api from "api.io-client";
import notification from "lib/notification";
import Image from "./lib/Image";
import Connections from "./lib/Connections";

class Tagging extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: [],
            files: []
        };
    }

    onFilesChange = (selected, files) => {
        this.setState({ selected, files });
    }

    onFacesChanged = async (faces) => {
        faces.sort((a, b) => a.x - b.x);

        try {
            await api.vfs.update(this.state.selected[0].path, { faces });
        } catch (error) {
            this.logError("Failed to save faces", error);
            notification.add("error", error.message, 10000);
        }
    }

    onRemove = async (face) => {
        const faces = this.state.selected[0].attributes.faces.filter((f) => f !== face);

        try {
            await api.vfs.update(this.state.selected[0].path, { faces });
        } catch (error) {
            this.logError("Failed to remove face", error);
            notification.add("error", error.message, 10000);
        }
    }

    gotoFile(indexOffset) {
        let index = this.state.files.indexOf(this.state.selected[0]);

        if (index === -1) {
            return;
        }

        index = index + indexOffset;

        if (index >= this.state.files.length) {
            index = 0;
        } else if (index < 0) {
            index = this.state.files.length - 1;
        }

        this.setState({ selected: [ this.state.files[index] ] });
    }

    onNext = () => {
        this.gotoFile(1);
    }

    onPrevious = () => {
        this.gotoFile(-1);
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    Tagging
                    <Header.Subheader>
                        Tag persons on files
                    </Header.Subheader>
                </Header>
                <SelectableImageList
                    className={this.props.theme.tagImageList}
                    path={`${this.props.node.path}/files`}
                    value={this.state.selected}
                    onChange={this.onFilesChange}
                    single
                />
                <If condition={this.state.files.length > 0}>
                    <div className={this.props.theme.navigationMenu}>
                        <Button
                            basic
                            size="mini"
                            content="Previous"
                            icon="left arrow"
                            labelPosition="left"
                            floated="left"
                            onClick={this.onPrevious}
                        />
                        <Button
                            basic
                            size="mini"
                            content="Next"
                            icon="right arrow"
                            labelPosition="right"
                            floated="right"
                            onClick={this.onNext}
                        />
                        <div className={this.props.theme.imageCount}>
                            {this.state.files.indexOf(this.state.selected[0]) + 1}
                            {" of "}
                            {this.state.files.length}
                        </div>
                    </div>
                </If>
                <Grid>
                    <Grid.Row>
                        <If condition={this.state.selected[0]}>
                            <Grid.Column width={10}>
                                <Image
                                    theme={this.props.theme}
                                    path={this.state.selected[0].path}
                                    faces={this.state.selected[0].attributes.faces}
                                    onChange={this.onFacesChanged}
                                    size={2000}
                                />
                            </Grid.Column>
                            <Grid.Column width={6}>

                                <If condition={this.state.selected[0].attributes.faces.length > 0}>
                                    <Connections
                                        theme={this.props.theme}
                                        node={this.state.selected[0]}
                                        onRemove={this.onRemove}
                                    />
                                </If>
                            </Grid.Column>
                        </If>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

Tagging.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

Tagging.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Tagging;
