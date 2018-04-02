
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Comments: require("./Comments")
};

module.exports = themeify(theme, exports);
