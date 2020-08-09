
import axios from "axios";
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
            const formData = new FormData();

            formData.append("file", file);
            formData.append("path", targetPath);
            formData.append("name", file.name);

            this.update({
                text: `Uploading ${files.length - n} file(s) to ${targetPath}`
            });

            const result = await axios.request({
                method: "post",
                url: `${backend.getAddress()}/upload`,
                headers: {
                    "session": session,
                    "Content-Type": "multipart/form-data"
                },
                data: formData,
                onUploadProgress: (p) => {
                    this.update({
                        progress: (step * n) + ((p.loaded * step) / p.total)
                    });
                }
            });

            if (result.status !== 200) {
                console.error("Upload failure", file. targetPath, result);
                throw new Error(result.statusText);
            }

            this.update({
                progress: step * (n + 1)
            });
        }

        return `Uploaded ${files.length} file(s) successfully`;
    }
}

export default UploadJob;
