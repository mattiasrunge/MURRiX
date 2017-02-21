"use strict";

const path = require("path");
const columnify = require("columnify");
const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("mcs status", "Print status of MCS job queue.")
.action(vorpal.wrap(async (ctx, session, args) => {
    let jobs = await api.mcs.getStatus();

    if (jobs.length > 0 ) {
        for (let job of jobs) {
            let basename = path.basename(job.filename);
            let id = basename.substr(0, basename.indexOf("."));
            let paths = await api.vfs.lookup(id);

            job.path = paths[0];
        }

        let columns = columnify(jobs.map((job) => {
            return {
                state: (job.running ? "A".green : "Q".red),
                format: job.format.type.bold,
                size: (job.format.width || 0) + "x" + (job.format.height || 0),
                path: job.path.bold,
                target: path.basename(job.format.filepath),
            };
        }), {
            showHeaders: true
        });

        ctx.log(columns);
    }

    ctx.log("total " + jobs.length);
}));
