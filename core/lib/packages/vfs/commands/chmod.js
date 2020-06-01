
"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Change mode bits for node
    //
    // Modes:
    //   7  rwx  read, write and execute
    //   6  rw-  read and write
    //   5  r-x  read and execute
    //   4  r--  read only
    //   3  -wx  write and execute
    //   2  -w-  write only
    //   1  --x  execute only
    //   0  ---  none
    opts, // r Recursive chmod
    mode, // Mode
    abspath // AbsolutePath
) => {
    await api.chmod(client, abspath, mode, {
        recursive: opts.r
    });
};
