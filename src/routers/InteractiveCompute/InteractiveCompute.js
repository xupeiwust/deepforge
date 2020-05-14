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
        this.clientServer = null;
        this.workerServer = null;
        this.blobClient = blobClient;
    }

    listen (port) {
        // TODO: Can I piggyback off the webgme server? Maybe using a different path?
        this.clientServer = new WebSocket.Server({port});  // FIXME: this might be tricky on the current deployment
        this.workerServer = new WebSocket.Server({port: port + 1});

        this.clientServer.on('connection', ws => {
            ws.once('message', data => {
                try {
                    const [id, config] = JSON.parse(data);
                    const backend = Compute.getBackend(id);
                    const client = backend.getClient(this.logger, this.blobClient, config);
                    const session = new InteractiveSession(this.blobClient, client, ws);
                    this.initSessions.push(session);
                } catch (err) {
                    ws.send(Message.encode(Message.COMPLETE, err.message));
                    this.logger.warn(`Error creating session: ${err}`);
                    ws.close();
                }
            });
        });

        this.workerServer.on('connection', ws => {
            ws.once('message', data => {
                const id = data.toString();
                const index = this.initSessions.findIndex(session => session.id === id);
                if (index > -1) {
                    const [session] = this.initSessions.splice(index, 1);
                    session.setWorkerWebSocket(ws);
                } else {
                    console.error(`Session not found for ${id}`);
                    ws.close();
                }
            });
        });
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
