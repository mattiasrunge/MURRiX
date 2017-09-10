
import api from "api.io-client";

export default {
    desc: "Import old MURRiX v1 mongodb database",
    args: [ "dbname", "filespath", "copymode" ],
    exec: async (term, streams, cmd, opts, args) => {
        const result = await api.update.import(args.dbname, args.filespath, args.copymode);

        for (const name of Object.keys(result)) {
            streams.stdout.write(`Imported ${result[name]} ${name}\n`);
        }
    }
};
