const Message = require('./message');
const {spawn} = require('child_process');
const [, , SERVER_URL, ID] = process.argv;
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

const ws = new WebSocket(SERVER_URL);
ws.on('open', () => ws.send(ID));

// TODO: Should this run in a single subprocess or in many?
// For now, let's run it in a single subprocess...
ws.on('message', async function(data) {
    // TODO: Run the command and send the results back
    // TODO: Queue the commands here?
    const msg = Message.decode(data);
    if (msg.type === Message.RUN) {
        const [cmd, ...opts] = msg.data.split(' ');
        const subprocess = spawn(cmd, opts);
        subprocess.on('close', code => ws.send(Message.encode(Message.COMPLETE, code)));
        subprocess.stdout.on('data', data => ws.send(Message.encode(Message.STDOUT, data)));
        subprocess.stderr.on('data', data => ws.send(Message.encode(Message.STDERR, data)));
    } else if (msg.type === Message.ADD_ARTIFACT) {
        console.log('adding artifact...');
        const [name, dataInfo, type] = msg.data;
        console.log(name, dataInfo, type);
        console.log(msg);
        await mkdirp(['artifacts', name]);
        // TODO: make artifacts/ directory if needed?
    }
});

async function mkdirp() {
    const dirs = Array.prototype.slice.call(arguments);
    for (let i = 0; i < dirs.length; i++) {
        try {
            await fs.mkdir(dirs[i]);
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
    }
}
