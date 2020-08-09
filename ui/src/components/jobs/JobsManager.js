
import { NotificationManager } from "react-notifications";
import MoveJob from "./jobs/MoveJob";
import DeleteJob from "./jobs/DeleteJob";
import UploadJob from "./jobs/UploadJob";

const JobTypes = {
    "move": MoveJob,
    "delete": DeleteJob,
    "upload": UploadJob
};

class JobsManager {
    constructor() {
        this.jobs = [];
        this.dispatch = () => {};
    }

    registerDispatch(dispatch) {
        this.dispatch = dispatch;
    }

    _add = (job) => {
        this.jobs.push(job);
        this.dispatch({ type: "add", job });
    }

    _create = (Type) => {
        const job = new Type(this._update);
        this._add(job);

        return job;
    }

    _update = (job) => {
        this.jobs = [
            ...this.jobs.filter((j) => j !== job),
            job
        ];

        this.dispatch({ type: "update", job });
    }

    _delete = (job) => {
        this.jobs = this.jobs.filter((j) => j !== job);

        this.dispatch({ type: "delete", job });
    }

    async _run(Type, ...args) {
        const job = this._create(Type);

        try {
            const result = await job.run(...args);

            NotificationManager.success(result);
        } catch (error) {
            console.error(error);
            NotificationManager.error(`${job.name} job failed, ${error.message}`);
        } finally {
            this._delete(job);
        }
    }

    create(type, ...args) {
        if (!JobTypes[type]) {
            throw new Error(`No job type named ${type} found`);
        }

        this._run(JobTypes[type], ...args);
    }
}

export default new JobsManager();
