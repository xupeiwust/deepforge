/* globals define */
define([
    'deepforge/utils',
    'deepforge/compute/interactive/task',
    'deepforge/compute/interactive/message',
    'deepforge/compute/interactive/errors',
], function(
    utils,
    Task,
    Message,
    Errors,
) {
    const {defer} = utils;
    const {CommandFailedError} = Errors;
    class InteractiveSession {
        constructor(computeID, config) {
            this.currentTask = null;
            // TODO: Get the server address...
            // TODO: detect if ssl
            const address = 'ws://localhost:8889';
            this.ws = new WebSocket(address);
            this.connected = defer();
            this.ws.onopen = () => {
                this.ws.send(JSON.stringify([computeID, config]));
                this.checkReady();
                this.connected.resolve();
            };

            this.ready = null;
        }

        checkReady() {
            if (this.isIdle() && this.ready) {
                this.ready.resolve();
            }
        }

        isIdle() {
            return !this.currentTask && this.ws.readyState === WebSocket.OPEN;
        }

        ensureIdle(action) {
            if (!this.isIdle()) {
                throw new Error(`Cannot ${action} when not idle.`);
            }
        }

        spawn(cmd) {
            this.ensureIdle('spawn a task');

            const msg = new Message(Message.RUN, cmd);
            const task = new Task(this.ws, msg);
            this.runTask(task);
            return task;
        }

        async runTask(task) {
            this.ensureIdle('run task');

            this.currentTask = task;
            await task.run();
            this.currentTask = null;
            this.checkReady();
        }

        async whenConnected() {
            return this.connected.promise;
        }

        async whenReady() {
            this.ready = this.ready || defer();
            return this.ready.promise;
        }

        async exec(cmd) {
            this.ensureIdle('exec a task');
            const msg = new Message(Message.RUN, cmd);
            const task = new Task(this.ws, msg);
            const result = {
                stdout: '',
                stderr: '',
                exitCode: 0
            };
            task.on(Message.STDOUT, data => result.stdout += data.toString());
            task.on(Message.STDERR, data => result.stderr += data.toString());
            task.on(Message.COMPLETE, code => result.exitCode = code);
            await this.runTask(task);
            if (result.exitCode) {
                throw new CommandFailedError(cmd, result);
            }
            return result;
        }

        async addArtifact(name, dataInfo, type, auth) {
            this.ensureIdle('add artifact');
            const msg = new Message(Message.ADD_ARTIFACT, [name, dataInfo, type, auth]);
            const task = new Task(this.ws, msg);
            await this.runTask(task);
        }

        close() {
            this.ws.close();
        }

        static async new(computeID, config={}) {
            const session = new InteractiveSession(computeID, config);
            await session.whenConnected();
            return session;
        }
    }

    Object.assign(InteractiveSession, Message.Constants);

    return InteractiveSession;
});
