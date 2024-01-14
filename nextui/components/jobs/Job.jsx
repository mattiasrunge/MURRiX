
import React from "react";
import PropTypes from "prop-types";
import { Segment, Progress } from "semantic-ui-react";

const Job = (props) => (
    <Segment>
        <Progress
            percent={Math.min(100, Math.ceil(props.progress))}
            progress
            autoSuccess
            active
            size="small"
            color={props.color}
        >
            {props.text}
        </Progress>
    </Segment>
);

Job.defaultProps = {
    color: "grey"
};

Job.propTypes = {
    progress: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    color: PropTypes.string
};

export default Job;
