
import ko from "knockout";

const list = ko.observableArray();
let count = 0;

module.exports = {
    list: ko.observableArray(),
    printError: (text) => {
        console.error(text);
        console.error(new Error().stack);

        if (typeof text === "string") {
            text = text.split("\n")[0];
        } else if (text instanceof Error) {
            text = `Error: ${text.message}`;
        }

        const message = {
            message: text,
            key: count++,
            className: "alert alert-danger",
            dismissAfter: 10000,
            dismiss: () => {
                module.exports.list.remove(message);
            }
        };

        module.exports.list.push(message);
    },
    printSuccess: (text) => {
        console.log(text);

        const message = {
            message: text,
            key: count++,
            className: "alert alert-success",
            dismissAfter: 5000,
            dismiss: () => {
                module.exports.list.remove(message);
            }
        };

        module.exports.list.push(message);
    },
    printWarning: (text) => {
        console.log(text);

        const message = {
            message: text,
            key: count++,
            className: "alert alert-warning",
            dismissAfter: 5000,
            dismiss: () => {
                module.exports.list.remove(message);
            }
        };

        module.exports.list.push(message);
    },
    printInfo: (text) => {
        console.log(text);

        const message = {
            message: text,
            key: count++,
            className: "alert alert-info",
            dismissAfter: 5000,
            dismiss: () => {
                module.exports.list.remove(message);
            }
        };

        module.exports.list.push(message);
    },
    create: () => {
        const line = "unnamed"; // new Error().stack.split("\n")[2].trim().split(" ")[2];
        // line = line.substr(1, line.length - 2);

        const status = ko.observable(false);
        list.push({ status: status, name: line });

        return status;
    },
    destroy: (status) => {
        const item = list().filter((item) => item.status === status)[0];

        if (item) {
            list.remove(item);
        }
    },
    loading: ko.pureComputed(() => {
        // console.log("status", JSON.stringify(list().map((item) => item.name + " => " + ko.unwrap(item.status)), null, 2));

        return list().filter((item) => item.status()).length > 0;
    })
};
