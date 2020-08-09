
import React from "react";
import { Segment } from "semantic-ui-react";
import JobsManager from "./JobsManager";
import Job from "./Job";
import theme from "./theme.module.css";

const reducer = (jobs, action) => {
    switch (action.type) {
        case "add": {
            return [ ...jobs, action.job ];
        }
        case "update": {
            const jobsCopy = jobs.slice(0);
            const index = jobsCopy.indexOf(action.job);

            jobsCopy.splice(index, 1, action.job);

            return jobsCopy;
        }
        case "delete": {
            return jobs.filter((j) => j !== action.job);
        }
        default: {
            throw new Error(`Unknown action type ${action.type} passed to reducer`);
        }
    }
};

const JobsContainer = () => {
    const [ jobs, dispatch ] = React.useReducer(reducer, []);

    React.useEffect(() => {
        JobsManager.registerDispatch(dispatch);
    }, []);

    return (
        <div className={theme.jobContainer}>
            <Segment.Group raised>
                <For each="job" of={jobs}>
                    <Job
                        key={job.id}
                        text={job.text}
                        progress={job.progress}
                        color={job.color}
                    />
                </For>
            </Segment.Group>
        </div>
    );
};

export default JobsContainer;
