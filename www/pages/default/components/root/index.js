
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Root: require("./Root")
};

module.exports = themeify(theme, exports);
