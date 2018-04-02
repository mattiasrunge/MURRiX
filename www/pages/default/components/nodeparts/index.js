
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    NodeInput: require("./NodeInput"),
    NodeImage: require("./NodeImage"),
    NodeIcon: require("./NodeIcon"),
    NodeCard: require("./NodeCard"),
    NodeHeader: require("./NodeHeader"),
    NodeLabels: require("./NodeLabels")
};

module.exports = themeify(theme, exports);
