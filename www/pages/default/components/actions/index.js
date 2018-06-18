
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Actions: require("./Actions")
};

module.exports = themeify(theme, exports);
