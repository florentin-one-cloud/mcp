import createPortalServer from "./portal-server.js";
import { createWorkerHandler } from "../../shared/workers-adapter/index.js";

const server = createPortalServer();
export default createWorkerHandler(server);
