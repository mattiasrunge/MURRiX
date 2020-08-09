
import Job from "./Job";
import { api } from "lib/backend";

class MoveJob extends Job {
    constructor(onUpdate) {
        super("blue", "Move", onUpdate);
    }

    async run(nodes, targetPath) {
        const step = 100 / nodes.length;

        for (let n = 0; n < nodes.length; n++) {
            const node = nodes[n];

            this.update({
                text: `Moving ${nodes.length - n} node(s) to ${targetPath}`
            });

            await api.move(node.path, targetPath);

            this.update({
                progress: step * (n + 1)
            });
        }

        return `Moved ${nodes.length} node(s) successfully`;
    }
}

export default MoveJob;
