
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Label, Loader } from "semantic-ui-react";

class FileStatus extends Component {
    render() {
        return (
            <Choose>
                <When condition={this.props.status === "queued"}>
                    <Label size="small" basic content="Queued" />
                </When>
                <When condition={this.props.status === "uploading"}>
                    <Label size="small" basic color="yellow">
                        <Loader active inline size="mini" />
                        &nbsp;{" "}
                        Uploading...
                    </Label>
                </When>
                <When condition={this.props.status === "importing"}>
                    <Label size="small" basic color="olive">
                        <Loader active inline size="mini" />
                        &nbsp;{" "}
                        Importing...
                    </Label>
                </When>
                <When condition={this.props.status === "complete"}>
                    <Label size="small" content="Imported" color="green" />
                </When>
                <When condition={this.props.status === "error"}>
                    <Label size="small" content={this.props.error || "Error"} color="red" />
                </When>
                <Otherwise>
                    <Label size="small" basic content={"Unknown"} color="orange" />
                </Otherwise>
            </Choose>
        );
    }
}

FileStatus.propTypes = {
    theme: PropTypes.object,
    status: PropTypes.string.isRequired,
    error: PropTypes.string
};

export default FileStatus;
