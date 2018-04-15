
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    SelectableImageList: require("./SelectableImageList")
};

module.exports = themeify(theme, exports);
