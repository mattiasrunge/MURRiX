
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Map: require("./Map")
};

module.exports = themeify(theme, exports);
