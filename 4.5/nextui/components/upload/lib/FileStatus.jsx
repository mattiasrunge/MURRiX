
import React from "react";
import PropTypes from "prop-types";
import { Label, Loader } from "semantic-ui-react";

const FileStatus = ({ status, error }) => (
    <Choose>
        <When condition={status === "queued"}>
            <Label size="small" basic content="Queued" />
        </When>
        <When condition={status === "uploading"}>
            <Label size="small" basic color="yellow">
                <Loader active inline size="mini" />
                &nbsp;{" "}
                Uploading...
            </Label>
        </When>
        <When condition={status === "importing"}>
            <Label size="small" basic color="olive">
                <Loader active inline size="mini" />
                &nbsp;{" "}
                Importing...
            </Label>
        </When>
        <When condition={status === "complete"}>
            <Label size="small" content="Imported" color="green" />
        </When>
        <When condition={status === "error"}>
            <Label size="small" content={error || "Error"} color="red" />
        </When>
        <Otherwise>
            <Label size="small" basic content={"Unknown"} color="orange" />
        </Otherwise>
    </Choose>
);

FileStatus.propTypes = {
    status: PropTypes.string.isRequired,
    error: PropTypes.string
};

export default FileStatus;
