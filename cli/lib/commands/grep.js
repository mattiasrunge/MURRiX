"use strict";

const stripAnsi = require("strip-ansi");
const vorpal = require("../vorpal");

vorpal
.command("grep <pattern> [files...]", "Grep implementation.")
.option("-v, --invert-match", "select non-matching lines")
.action(vorpal.wrap(function*(session, args) {
    let stdin = args.stdin.map(stripAnsi);
    let pattern = new RegExp(`(${args.pattern})`, "gi");

    for (let data of stdin) {
        let lines = data.split("\n");

        for (let line of lines) {
            if (line.match(pattern)) {
                this.log(line);
            }
        }
    }
}));
