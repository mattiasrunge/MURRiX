import Chalk from "chalk";

// Don't use color autodetect... it checks stdout
// which we don't output to
export default new Chalk.Instance({ level: 3 });
