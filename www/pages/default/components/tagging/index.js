
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Tagging: require("./Tagging")
};

module.exports = themeify(theme, exports);
