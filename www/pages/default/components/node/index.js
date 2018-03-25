
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Node: require("./Node")
};

module.exports = themeify(theme, exports);
