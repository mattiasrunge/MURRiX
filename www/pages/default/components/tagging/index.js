
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Tagging: require("./Tagging"),
    TagModal: require("./TagModal")
};

module.exports = themeify(theme, exports);
