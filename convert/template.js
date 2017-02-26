
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

{{{require}}}

class {{{name}}} extends Knockout {
    async getModel() {
        const model = {};

{{{model}}}

        return model;
    }

    getTemplate() {
        return (
{{{html}}}
        );
    }
}

export default {{{name}}};
