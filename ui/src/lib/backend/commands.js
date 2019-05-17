
class Commands {
    constructor(backend) {
        this.pending = {};

        backend.on("message", (event, message) => {
            if (!message.id) {
                return;
            }

            const operation = this.pending[message.id];

            if (!operation) {
                return console.error("No such pending operation found", message);
            }

            clearTimeout(operation.timeout);
            delete this.pending[operation.id];

            if (message.error) {
                const error = new Error(message.error.messsage);

                error.code = message.error.code;
                message.error.stack && (error.stack = message.error.stack);

                return operation.reject(error);
            }

            operation.resolve(message.result);
        });

        return new Proxy(this, {
            get: (target, name) => (...args) => new Promise((resolve, reject) => {
                let id = Date.now();

                while (this.pending[id]) {
                    id = Date.now();
                }

                const operation = {
                    id,
                    resolve,
                    reject,
                    message: {
                        id,
                        name,
                        args: [ ...args ]
                    },
                    timeout: setTimeout(() => {
                        delete this.pending[id];

                        reject();
                    }, 1000 * 60 * 10) // 10 minutes
                };

                this.pending[id] = operation;

                backend.send(operation.message);
            })
        });
    }
}

export default Commands;
