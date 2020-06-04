/* globals requireJS */
'use strict';

const WebSocket = require('ws');
const router = require('express').Router();
const Compute = requireJS('deepforge/compute/index');
const BlobClient = requireJS('blob/BlobClient');
const Message = requireJS('deepforge/compute/interactive/message');
const InteractiveSession = require('./Session');

class ComputeBroker {
    constructor(logger, blobClient) {
        this.logger = logger.fork('broker');
        this.initSessions = [];
        this.wss = null;
        this.blobClient = blobClient;
    }

    listen (port) {
        // TODO: Can I piggyback off the webgme server? Maybe using a different path?
        this.wss = new WebSocket.Server({port});  // FIXME: this might be tricky on the current deployment

        this.wss.on('connection', ws => {
            ws.once('message', data => {
                const isClient = data.startsWith('[');
                if (isClient) {
                    this.onClientConnected(ws, ...JSON.parse(data));
                } else {
                    this.onWorkerConnected(ws, data);
                }
            });
        });
    }

    onClientConnected (ws, id, config) {
        try {
            const backend = Compute.getBackend(id);
            const client = backend.getClient(this.logger, this.blobClient, config);
            const session = new InteractiveSession(this.blobClient, client, ws);
            this.initSessions.push(session);
        } catch (err) {
            ws.send(Message.encode(Message.COMPLETE, err.message));
            this.logger.warn(`Error creating session: ${err}`);
            ws.close();
        }
    }

    onWorkerConnected (ws, id) {
        const index = this.initSessions.findIndex(session => session.id === id);
        if (index > -1) {
            const [session] = this.initSessions.splice(index, 1);
            session.setWorkerWebSocket(ws);
        } else {
            this.logger.warn(`Session not found for ${id}`);
            ws.close();
        }
    }
}

function initialize(middlewareOpts) {
    const logger = middlewareOpts.logger.fork('InteractiveCompute');

    const {gmeConfig} = middlewareOpts;
    // TODO: Do I need to add authorization for the blob client?
    const blobClient = new BlobClient({
        logger: logger,
        serverPort: gmeConfig.server.port,
        server: '127.0.0.1',
        httpsecure: false,
    });
    const broker = new ComputeBroker(logger, blobClient);
    broker.listen(gmeConfig.server.port + 1);
    logger.debug('initializing ...');

    logger.debug('ready');
}

function start(callback) {
    callback();
}

function stop(callback) {
    callback();
}


module.exports = {
    initialize: initialize,
    router: router,
    start: start,
    stop: stop
};
