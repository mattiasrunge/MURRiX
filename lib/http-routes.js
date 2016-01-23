"use strict";

module.exports = {
    "/test/:id": function*(id) {
        console.log("test");
        this.type = "text/plain";
        this.body = "Test:" + id;
    }
};
