/* globals define */
define([
    'deepforge/EventEmitter',
    'deepforge/compute/interactive/message',
    'deepforge/utils',
], function(
    EventEmitter,
    Message,
    utils,
) {

    class Task extends EventEmitter {
        constructor(ws, cmd) {
            super();
            this.ws = ws;
            this.cmd = cmd;
        }

        async run() {
            const deferred = utils.defer();

            this.ws.send(this.cmd);
            this.ws.onmessage = async wsMsg => {
                const data = wsMsg.data instanceof Blob ?
                    await wsMsg.data.text() : wsMsg.data;

                const msg = Message.decode(data);
                this.emitMessage(msg);
                if (msg.type === Message.CLOSE) {
                    this.ws.onmessage = null;
                    deferred.resolve();
                }
            };

            return deferred.promise;
        }

        emitMessage(msg) {
            this.emit(msg.type, msg.data);
        }
    }

    return Task;
});
