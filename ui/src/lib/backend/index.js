
import Server from "./server";
import Events from "./events";
import Commands from "./commands";
import MASKS from "./masks";

const backend = new Server();
const event = new Events(backend);
const cmd = new Commands(backend);

export {
    backend,
    cmd,
    event,
    MASKS
};
