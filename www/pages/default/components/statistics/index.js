
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Charts: require("./Charts")
};

module.exports = themeify(theme, exports);
