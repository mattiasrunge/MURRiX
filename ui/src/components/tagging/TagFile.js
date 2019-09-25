
import React from "react";
import PropTypes from "prop-types";
import { Grid, Message } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import notification from "lib/notification";
import Image from "./lib/Image";
import Connections from "./lib/Connections";
import theme from "./theme.module.css";

class TagFile extends Component {
    onFacesChanged = async (faces) => {
        faces.sort((a, b) => a.y - b.y);

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
        const faces = (this.props.node.attributes.faces || []).sort((a, b) => a.y - b.y);

        return (
            <Choose>
                <When condition={this.props.node.attributes.faces || this.props.node.attributes.type !== "image"}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={10}>
                                <Image
                                    theme={theme}
                                    path={this.props.node.path}
                                    faces={faces}
                                    onChange={this.onFacesChanged}
                                    size={2000}
                                />
                            </Grid.Column>
                            <Grid.Column width={6}>
                                <Connections
                                    theme={theme}
                                    node={this.props.node}
                                    suggestions={this.props.suggestions}
                                    onRemove={this.onRemove}
                                />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </When>
                <Otherwise>
                    <Message warning>
                        <Message.Header>Face detection has not run yet</Message.Header>
                        <p>Tagging is not possible until the face detection has been run on this file. Please wait until that has been complete before tagging.</p>
                    </Message>
                </Otherwise>
            </Choose>
        );
    }
}

TagFile.propTypes = {
    node: PropTypes.object.isRequired,
    suggestions: PropTypes.array
};

export default TagFile;
