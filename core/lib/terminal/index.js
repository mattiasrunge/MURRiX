"use strict";

const assert = require("assert");
const readline = require("readline");
const cjson = require("color-json");
const { table, getBorderCharacters } = require("table");
const parser = require("yargs-parser");
const { parseArgsStringToArgv } = require("string-argv");
const color = require("../lib/color");
const Deferred = require("../lib/Deferred");
const log = require("../lib/log")(module);
const commander = require("../commander");
const { api } = require("../api");
const obscurable = require("./obscurable");

class Terminal {
    constructor(client, stream) {
        this.client = client;
        this.stream = obscurable(stream);
        this.currentCmd = false;
        this.subprompt = new Deferred(true);
        this.userInterrupt = false;
    }

    async initialize() {
        this.readline = readline.createInterface({
            input: this.stream,
            output: this.stream,
            completer: this._completer.bind(this),
            historySize: 100,
            prompt: this._getPrompt()
        });

        await this._hookHistory();

        this.write(`Welcome ${color.bold(this.client.getUsername())}!`);

        this.readline.on("line", (line) => this._onLine(line));
        this.readline.on("close", () => this.stream.close());
        this.readline.on("SIGTSTP", () => {}); // This will override SIGTSTP and prevent the whole application from going to the background.
        this.readline.on("SIGINT", () => {
            if (!this.subprompt.resolved) {
                this.stream.unobscure();
                this.readline.write("^C");

                return this.subprompt.reject(new Error("User interrupted"));
            }

            if (this.currentCmd) {
                this.userInterrupt = true;
                this.readline.write("^C");
                this.readline.clearLine();

                return;
            }

            this.stream.unobscure();
            this.readline.write("^C");
            this.readline.clearLine();
            this.readline.setPrompt(this._getPrompt());
            this.readline.prompt();
        });

        this.readline.prompt();
    }

    async _hookHistory() {
        const addHistory = this.readline._addHistory.bind(this.readline);

        this.readline.history = await this._getHistory();
        this.readline._addHistory = () => {
            if (!this.subprompt.resolved) {
                return this.readline.line;
            }

            const line = addHistory();

            api.history(this.client, this.readline.history).catch((error) => log.error("Failed to store history", error));

            return line;
        };
    }

    async _getHistory() {
        try {
            return api.history(this.client);
        } catch {
            return [];
        }
    }

    _getPrompt() {
        return color.bold(`${this.client.isAdmin() ? color.greenBright("+") : ""}${color.greenBright(this.client.getUsername())} ${color.blueBright(this.client.getCurrentDirectory())} ${color.blueBright("$")} `);
    }

    _parseCommandLine(line) {
        const argv = parseArgsStringToArgv(line);
        const rawopts = argv.filter((f) => f.startsWith("-") && !f.startsWith("--"));
        const singleopts = Object.fromEntries(rawopts.map((f) => [ f.slice(1), true ]));
        const rawargs = argv.filter((a) => !rawopts.includes(a));
        const yargs = parser(rawargs);
        const args = yargs._;

        delete yargs._;

        const opts = {
            ...singleopts,
            ...yargs
        };

        const name = args.shift();

        if (!name) {
            return false;
        }

        return {
            name,
            args,
            opts
        };
    }

    _completer(line, callback) {
        // Get the commandline before the part that is being completed
        const first = line.split(" ").slice(0, -1).join(" ");

        // Get the word that is supposed to be completed
        const word = line.split(" ").slice(-1).pop() ?? "";

        // Try to parse the first part as a commandline
        const cmdline = this._parseCommandLine(first);

        // Get suggestions
        commander.autocomplete(this.client, cmdline, word)
        // eslint-disable-next-line promise/no-callback-in-promise
        .then((result) => callback(null, result))
        // eslint-disable-next-line promise/no-callback-in-promise
        .catch((error) => callback(error));
    }

    async _onLine(line) {
        if (!this.subprompt.resolved) {
            return this.subprompt.resolve(line);
        }

        if (this.currentCmd) {
            return;
        }

        if (line.trim().length === 0) {
            this.readline.setPrompt(this._getPrompt());
            this.readline.prompt();

            return;
        }

        try {
            const cmdline = this._parseCommandLine(line);

            assert(cmdline, "Failed to parse command line");

            this.currentCmd = cmdline.name;

            await commander.execute(this.client, this, cmdline.name, cmdline.opts, cmdline.args);
        } catch (error) {
            log.error(error);
            this.readline.clearLine();
            this.writeln(`${color.bold.redBright(error.message)}`);
        }

        this.currentCmd = false;
        this.userInterrupt = false;

        this.readline.setPrompt(this._getPrompt());
        this.readline.prompt();
    }

    setSize(cols, rows) {
        this.stream.columns = cols;
        this.stream.rows = rows;
    }

    async ask(prompt, obscure = false) {
        this.subprompt = new Deferred();

        this.readline.setPrompt(`${prompt} `);
        this.readline.prompt();

        obscure && this.stream.obscure(`${prompt} `);
        try {
            return await this.subprompt.promise;
        } finally {
            this.stream.unobscure();
        }
    }

    hasInterrupt() {
        return this.userInterrupt;
    }

    write(data) {
        const lines = data.split("\n");

        data.endsWith("\n") && lines.pop();

        for (const line of lines) {
            this.stream.write(`${line}\r\n`);
        }
    }

    writeln(data) {
        this.write(`${data}\n`);
    }

    writeJson(obj) {
        this.write(cjson(obj));
    }

    writeTable(data, options = {}) {
        const output = table(data, {
            border: getBorderCharacters("void"),
            singleLine: true,
            columnDefault: {
                paddingLeft: 0,
                paddingRight: 2
            },
            drawHorizontalLine: () => false,
            ...options
        });

        this.write(output);
    }

    size() {
        return {
            cols: this.stream.columns,
            rows: this.stream.rows
        };
    }

    dispose() {
        this.stream.close();
    }
}

module.exports = Terminal;
