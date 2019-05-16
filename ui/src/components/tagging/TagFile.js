
import React from "react";
import PropTypes from "prop-types";
import { Grid } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import notification from "lib/notification";
import Image from "./lib/Image";
import Connections from "./lib/Connections";
import theme from "./theme.module.css";

class TagFile extends Component {
    onFacesChanged = async (faces) => {
        faces.sort((a, b) => a.x - b.x);

        try {
            await cmd.update(this.props.node.path, { faces });
        } catch (error) {
            this.logError("Failed to save faces", error);
            notification.add("error", error.message, 10000);
        }
    }

    onRemove = async (face) => {
        const faces = (this.props.node.attributes.faces || []).filter((f) => f !== face);

        try {
            await cmd.update(this.props.node.path, { faces });
        } catch (error) {
            this.logError("Failed to remove face", error);
            notification.add("error", error.message, 10000);
        }
    }

    render() {
        return (
            <Grid>
                <Grid.Row>
                    <Grid.Column width={10}>
                        <Image
                            theme={theme}
                            path={this.props.node.path}
                            faces={this.props.node.attributes.faces || []}
                            onChange={this.onFacesChanged}
                            size={2000}
                        />
                    </Grid.Column>
                    <Grid.Column width={6}>
                        <Connections
                            theme={theme}
                            node={this.props.node}
                            onRemove={this.onRemove}
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }
}

TagFile.propTypes = {
    node: PropTypes.object.isRequired
};

export default TagFile;
