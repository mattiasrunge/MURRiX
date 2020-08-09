
import Job from "./Job";
import { api } from "lib/backend";

class DeleteJob extends Job {
    constructor(onUpdate) {
        super("red", "Delete", onUpdate);
    }

    async run(nodes) {
        const step = 100 / nodes.length;

        for (let n = 0; n < nodes.length; n++) {
            const node = nodes[n];

            this.update({
                text: `Deleting ${nodes.length - n} node(s)`
            });

            await api.unlink(node.path);

            this.update({
                progress: step * (n + 1)
            });
        }

        return `Deleted ${nodes.length} node(s) successfully`;
    }
}

export default DeleteJob;
