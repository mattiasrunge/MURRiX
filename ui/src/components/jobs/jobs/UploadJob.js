
import Flow from "@flowjs/flow.js";
import cookies from "browser-cookies";
import { backend } from "lib/backend";
import Job from "./Job";

class UploadJob extends Job {
    constructor(onUpdate) {
        super("purple", "Upload", onUpdate);
    }

    async run(files, targetPath) {
        const step = 100 / files.length;
        const session = cookies.get("session"); // TODO: Wrap in backend function

        for (let n = 0; n < files.length; n++) {
            const file = files[n];

            this.update({
                text: `Uploading ${file.name} to ${targetPath}, ${files.length - n} left`
            });

            const flow = new Flow({
                target: `${backend.getAddress()}/upload`,
                chunkSize: 1 * 1024 * 1024 * 3, // 3 Mb
                headers: {
                    "session": session
                },
                query: {
                    path: targetPath
                }
            });

            flow.on("progress", () => {
                const p = flow.progress();

                this.update({
                    progress: (step * n) + (p * step)
                });
            })

            flow.addFile(file);

            await new Promise((resolve, reject) => {
                flow.on("complete", resolve);
                flow.on("error", (error) => console.error(error));

                flow.upload();
            });

            this.update({
                progress: step * (n + 1)
            });
        }

        return `Uploaded ${files.length} file(s) successfully`;
    }
}

export default UploadJob;
