
import React from "react";
import PropTypes from "prop-types";
import { Header, Grid } from "semantic-ui-react";
import Component from "lib/component";
import { SelectableImageList } from "components/list";
import MoveToList from "../lib/MoveToList";
import theme from "../../theme.module.css";

class Organize extends Component {
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