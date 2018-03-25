
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Terminal: require("./Terminal")
};

module.exports = themeify(theme, exports);
