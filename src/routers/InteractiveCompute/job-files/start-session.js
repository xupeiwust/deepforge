const Message = require('./message');
const {spawn} = require('child_process');
const [, , SERVER_URL, ID] = process.argv;
const WebSocket = require('ws');

const ws = new WebSocket(SERVER_URL);
ws.on('open', () => ws.send(ID));

// TODO: Should this run in a single subprocess or in many?
// For now, let's run it in a single subprocess...
ws.on('message', function(data) {
    // TODO: Run the command and send the results back
    // TODO: Queue the commands here?
    const [cmd, ...opts] = data.split(' ');
    const subprocess = spawn(cmd, opts);
    subprocess.stdout.on('data', data => ws.send(Message.encode(Message.STDOUT, data)));
    subprocess.stderr.on('data', data => ws.send(Message.encode(Message.STDERR, data)));
    subprocess.on('close', code => ws.send(Message.encode(Message.CLOSE, code)));
});
