
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header, Grid } from "semantic-ui-react";
import { SelectableImageList } from "components/list";

class Batch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: []
        };
    }

    onSelectedChange = (selected) => {
        this.setState({ selected });
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    Batch
                    <Header.Subheader>
                        Perform batch operations
                    </Header.Subheader>
                </Header>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={9}>
                            <SelectableImageList
                                path={`${this.props.node.path}/files`}
                                value={this.state.selected}
                                onChange={this.onSelectedChange}
                            />
                        </Grid.Column>
                        <Grid.Column width={7}>
                            <Header as="h4">Date & Time</Header>

                            <Header as="h4">Camera</Header>

                            <Header as="h4">Location</Header>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

Batch.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default Batch;
