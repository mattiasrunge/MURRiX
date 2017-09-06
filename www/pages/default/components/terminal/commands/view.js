
import api from "api.io-client";
import React from "react";
import ReactDOMServer from "react-dom/server";
import NodeWidgetCard from "plugins/node/components/widget-card";

export default {
    desc: "View path",
    args: [ "?path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.srcpath, true);
        const nodepath = await api.vfs.resolve(abspath, { nodepath: true });

        const el = (
            <NodeWidgetCard nodepath={nodepath} />
        );


        await streams.stdout.write(ReactDOMServer.renderToStaticMarkup(el));
    },
    completion: async (term, cmd, name, value) => {
        if (name === "srcpath" || name === "dstpath") {
            return await term.completePath(value);
        }

        return [];
    }
};
