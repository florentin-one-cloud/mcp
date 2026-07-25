import createServer from './index.js';
import { createWorkerHandler } from '../../shared/workers-adapter/index.js';

const server = createServer();
export default createWorkerHandler(server);
