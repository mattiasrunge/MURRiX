import assert from "node:assert";
import Generic from "./Generic.mjs";

class Number2 extends Generic {
    static async validate(client, value) {
        assert(!Number.isNaN(Number.parseInt(value, 10)), `${value} is not a number`);
    }

    static async transform(client, value) {
        return Number.parseInt(value, 10);
    }
}

export default Number2;
