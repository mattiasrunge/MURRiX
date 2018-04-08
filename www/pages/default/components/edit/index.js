
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Edit: require("./Edit"),
    EditModal: require("./EditModal"),
    CreateModal: require("./CreateModal")
};

module.exports = themeify(theme, exports);
