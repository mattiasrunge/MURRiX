
import React from "react";
import PropTypes from "prop-types";
import { Header, Grid } from "semantic-ui-react";
import Component from "lib/component";
import { SelectableImageList } from "components/list";
import { Viewer } from "components/viewer";
import MoveToList from "../lib/MoveToList";
import theme from "../../theme.module.css";

class Organize extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: [],
            file: false,
            files: []
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

    render() {
        return (
            <div>
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
                        <Grid.Column width={9}>
                            <SelectableImageList
                                path={`${this.props.node.path}/files`}
                                value={this.state.selected}
                                onChange={this.onSelectedChange}
                                onView={this.onView}
                            />
                        </Grid.Column>
                        <Grid.Column width={7}>
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
