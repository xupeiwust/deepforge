/* globals define */
define([], function() {

    class ComputeClient {
        constructor (logger, blobClient) {
            this.logger = logger.fork('compute');
            this.blobClient = blobClient;
            this._events = {};
        }

        cancelJob (/*job*/) {
            unimplemented(this.logger, 'cancelJob');
        }

        createJob (/*hash*/) {
            unimplemented(this.logger, 'createJob');
        }

        getStatus (/*jobInfo*/) {
            unimplemented(this.logger, 'getStatus');
        }

        getResultsInfo (/*jobInfo*/) {
            unimplemented(this.logger, 'getResultsInfo');
        }

        getConsoleOutput (/*hash*/) {
            unimplemented(this.logger, 'getConsoleOutput');
        }

        isFinishedStatus (status) {
            const notFinishedStatuses = [this.QUEUED, this.PENDING, this.RUNNING];
            return !notFinishedStatuses.includes(status);
        }

        // Some functions for event support
        on (ev, cb) {
            this._events[ev] = this._events[ev] || [];
            this._events[ev].push(cb);
        }

        emit (ev) {
            const args = Array.prototype.slice.call(arguments, 1);
            const handlers = this._events[ev] || [];
            return Promise.all(handlers.map(fn => fn.apply(this, args)));
        }
    }

    ComputeClient.prototype.QUEUED = 'queued';
    ComputeClient.prototype.PENDING = 'pending';
    ComputeClient.prototype.RUNNING = 'running';
    ComputeClient.prototype.SUCCESS = 'success';
    ComputeClient.prototype.FAILED = 'failed';
    ComputeClient.prototype.CANCELED = 'canceled';
    ComputeClient.prototype.NOT_FOUND = 'NOT_FOUND';

    function unimplemented(logger, name) {
        const msg = `${name} is not implemented for current compute backend!`;
        logger.error(msg);
        throw new Error(msg);
    }

    return ComputeClient;
});
