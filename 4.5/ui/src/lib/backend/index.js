
import Server from "./server";
import Events from "./events";
import Api from "./api";

const backend = new Server();
const event = new Events(backend);
const api = new Api(backend);

export {
    backend,
    api,
    event
};
