
import api from "api.io-client";
import $ from "jquery";
import { parser as xml2json } from "simple-xml2json";

export default {
    desc: "Find, hide and use information xml files corresponding to video files",
    args: [ "suffix", "?path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath);

        if (node.properties.type !== "a") {
            throw new Error("Must be run on an album");
        }

        const filespath = `${abspath}/files`;
        const nodes = await api.vfs.list(filespath, { nofollow: true });

        await streams.stdout.write(`Found ${nodes.length} nodes\n`);

        const xmlfiles = nodes.filter((file) => file.node.attributes.name.match(`(.*)(${args.suffix})`));

        await streams.stdout.write(`Found ${xmlfiles.length} files to hide\n`);

        for (const file of xmlfiles) {
            const pattern = file.node.attributes.name.replace(args.suffix, "");

            await streams.stdout.write(`Will try to find video files that match pattern ${pattern}\n`);

            const videofile = nodes.find((videofile) => videofile.node.attributes.type === "video" && videofile.node.attributes.name.startsWith(pattern));

            if (videofile) {
                await streams.stdout.write(`Found a file that matches, ${videofile.node.attributes.name}, will move ${file.node.attributes.name}\n`);

                const url = `file/download/${file.node.attributes.diskfilename}/${file.node.attributes.name}`;

                const xml = await $.get(url);
                const data = xml2json(xml);

                const datestr = data.nonrealtimemeta.creationdate.value.substr(0, 10);
                const timestr = data.nonrealtimemeta.creationdate.value.substr(11, 8);
                const timezone = data.nonrealtimemeta.creationdate.value.substr(19);
                const date = datestr.split("-");
                const time = timestr.split(":");

                const attributes = {
                    deviceSerialNumber: data.nonrealtimemeta.device.serialno.toString(),
                    deviceinfo: {
                        model: data.nonrealtimemeta.device.modelname,
                        make: data.nonrealtimemeta.device.manufacturer
                    },
                    fileinfo: {
                        fps: parseInt(data.nonrealtimemeta.videoformat.videoframe.formatfps.replace(/[^0-9.]/g, ""), 10),
                        frames: parseInt(data.nonrealtimemeta.ltcchangetable.ltcchange[1].framecount, 10)
                    },
                    when: {
                        device: {
                            year: date[0],
                            month: date[1],
                            day: date[2],
                            hour: time[0],
                            minute: time[1],
                            second: time[2],
                            timezone: timezone,
                            deviceType: "unknown",
                            deviceAutoDst: false,
                            deviceUtcOffset: 0
                        }
                    }
                };

                await streams.stdout.write(`${JSON.stringify(attributes, null, 2)}\n`);

                await api.vfs.setattributes(videofile.path, attributes);
                await api.file.regenerate(videofile.path);

                const versionspath = `${videofile.path}/versions`;

                await api.vfs.ensure(versionspath, "d");
                await api.vfs.move(file.path, versionspath);

                await streams.stdout.write("Done moving file!\n");
            }
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
