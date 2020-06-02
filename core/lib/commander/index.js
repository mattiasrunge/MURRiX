"use strict";

const assert = require("assert");
const color = require("../lib/color");
const types = require("./types");

class Commander {
    constructor() {
        this.cmds = {};
    }

    async init() {
        await types.init();
    }

    register(name, fn) {
        const def = this._parseDefinition(name, fn);

        assert(def, `Failed to parse command ${name}`);

        const cmd = {
            name,
            fn,
            def
        };

        this._add(name, cmd);

        for (const alias of def.alias) {
            this._add(alias, cmd);
        }
    }

    _add(alias, cmd) {
        assert(!this.cmds[alias], `A command with the name ${alias} is already registered`);

        this.cmds[alias] = cmd;
    }

    async autocomplete(client, cmdline, word) {
        // If we have not parsed a command name that is what we should complete
        if (cmdline === false) {
            const hits = Object.keys(this.cmds).filter((name) => !word || name.startsWith(word));

            if (hits.length === 1 && word === hits[0]) {
                return [ [ " " ], "" ];
            }

            return [ hits, word ];
        }

        const cmd = this.cmds[cmdline.name];

        // If did not match any command we can not do auto completion
        if (!cmd) {
            return [ [], word ];
        }

        // Autocomplete flags
        if (word.startsWith("-")) {
            return [ Object.keys(cmd.def.opts).map((opt) => `-${opt}`), word ];
        }

        // Autocomplete param if it has a completer function
        const param = Object.values(cmd.def.params)[cmdline.args.length];

        if (param && param.Type.completer) {
            return await param.Type.completer(client, word);
        }

        return [ [], word ];
    }

    async execute(client, term, name, opts, args) {
        const cmd = this.cmds[name];

        assert(cmd, `${name}: Command not found`);

        if (opts.h) {
            this._printHelp(term, cmd);

            return 0;
        }

        try {
            await this._validateOptsAndArgs(client, cmd, opts, args);
        } catch (error) {
            this._printHelp(term, cmd, error.message);

            return 1;
        }

        const code = await cmd.fn(client, term, opts, ...args);

        return code ?? 0;
    }

    async _validateOptsAndArgs(client, cmd, opts, args) {
        // Check for unknown opts
        for (const name of Object.keys(opts)) {
            assert(cmd.def.opts[name], `Unknown option: ${name}`);
        }

        // Check for required params
        if (args.length < cmd.def.numRequiredParams) {
            const name = Object.keys(cmd.def.params)[args.length];

            throw new Error(`Missing required param: ${name}`);
        }

        // Validate args
        const params = Object.values(cmd.def.params);
        // eslint-disable-next-line unicorn/no-for-loop
        for (let n = 0; n < params.length; n++) {
            const param = params[n];

            if (param.Type.validate) {
                await param.Type.validate(client, args[n] || param.value);
            }

            if (param.Type.transform) {
                args[n] = await param.Type.transform(client, args[n] || param.value);
            }
        }
    }

    _printHelp(term, cmd, error) {
        if (error) {
            term.writeln(`${color.bold.redBright(error)}`);
        }

        const params = Object.entries(cmd.def.params).map(([ name, param ]) => typeof param.value !== "undefined" ? `[${name}]` : `<${name}>`);
        const opts = Object.entries(cmd.def.opts).map(([ name, opt ]) => `  -${name}  ${opt.description}`);

        term.write(`
Usage: ${cmd.name} ${Object.keys(opts).length > 0 ? "[options] " : ""}${params.join(" ")}

${cmd.def.description}
${cmd.def.alias.length > 0 ? `\nAlias: ${cmd.def.alias.join(", ")}\n` : ""}
Options:
  -h  Print help
${opts.join("\n")}

`);
    }

    _parseDefinition(name, fn) {
        const def = fn
        .toString()
        .match(/\( *([^)]+?) *\)/)[1]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(1)
        .map((l) => {
            l = l.trim();

            if (l.startsWith("//")) {
                let description = l.replace("//", "").replace(/\s+$/, "");

                if (description.trim().toLowerCase().startsWith("alias:")) {
                    const alias = description.replace("alias:").trim().split(";");

                    return { alias };
                }

                if (description[0] === " ") {
                    description = description.slice(1);
                }

                return { description };
            }

            const [ def, help ] = l.split("//");
            const [ paramName, value ] = def.split("=");
            const param = paramName.replace(",", "").trim();

            if (param === "opts") {
                const opts = (help || "")
                .trim()
                .split(";")
                .map((l) => l.trim())
                .filter(Boolean)
                .map((l) => {
                    const [ flag, description ] = l.replace(/\s+/, "\u0001").split("\u0001");

                    return {
                        name: flag.trim(),
                        description: description ?? ""
                    };
                });

                return { opts };
            }

            const type = (help || "").trim();
            const Type = types.get(type);

            assert(Type, `Command ${param} defined a param named ${param} of type ${type}, but that type does not exist`);

            return {
                name: param,
                Type,
                // eslint-disable-next-line no-undefined
                value: value ? JSON.parse(value.replace(",", "").trim()) : undefined
            };
        });

        if (def.length === 0) {
            return false;
        }

        const alias = def.find(({ alias }) => !!alias)?.alias ?? [];
        const description = def
        .filter(({ description }) => typeof description !== "undefined")
        .map(({ description }) => description)
        .join("\n") ?? "";

        const opts = Object
        .fromEntries((def.find(({ opts }) => !!opts)?.opts ?? [])
        .map((o) => ([ o.name, o ]))
        );

        const params = Object
        .fromEntries(def
        .filter((p) => !!p.Type)
        .map((p) => ([ p.name, p ]))
        );

        // No param can be required after a non required
        let numRequiredParams = 0;

        for (const param of Object.values(params)) {
            if (typeof param.value !== "undefined") {
                break;
            }

            numRequiredParams++;
        }

        return {
            name,
            alias,
            description,
            opts,
            params,
            numRequiredParams
        };
    }
}

module.exports = new Commander();
