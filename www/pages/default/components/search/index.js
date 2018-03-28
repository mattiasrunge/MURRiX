
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Search: require("./Search")
};

module.exports = themeify(theme, exports);
