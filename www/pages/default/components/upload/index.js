
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Upload: require("./Upload"),
    UploadProgress: require("./UploadProgress"),
    FileIcon: require("./lib/FileIcon")
};

module.exports = themeify(theme, exports);
