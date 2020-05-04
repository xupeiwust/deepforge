/* globals define */
define([
    'deepforge/utils',
    'deepforge/compute/interactive/task',
    'deepforge/compute/interactive/message',
], function(
    utils,
    Task,
    Message,
) {
    const {defer} = utils;
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

            const task = new Task(this.ws, cmd);
            this.runTask(task);
            return task;
        }

        async runTask(task) {
            this.ensureIdle('spawn a task');

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
            const task = new Task(this.ws, cmd);
            const result = {
                stdout: '',
                stderr: '',
                exitCode: 0
            };
            task.on(Message.STDOUT, data => result.stdout += data.toString());
            task.on(Message.STDERR, data => result.stderr += data.toString());
            task.on(Message.CLOSE, code => result.exitCode = code);
            await this.runTask(task);
            return result;
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
