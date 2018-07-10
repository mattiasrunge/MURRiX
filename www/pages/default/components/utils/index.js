
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Focus: require("./Focus"),
    StringList: require("./StringList")
};

module.exports = themeify(theme, exports);