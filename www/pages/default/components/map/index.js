
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Map: require("./Map"),
    Address: require("./Address")
};

module.exports = themeify(theme, exports);
