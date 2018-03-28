
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Node: require("./Node"),
    NodeInput: require("./NodeInput"),
    NodeProfilePicture: require("./NodeProfilePicture"),
    NodeIcon: require("./NodeIcon")
};

module.exports = themeify(theme, exports);
