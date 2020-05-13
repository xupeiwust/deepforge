const Message = require('./message');
const {spawn} = require('child_process');
const [, , SERVER_URL, ID] = process.argv;
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const requirejs = require('requirejs');

const ws = new WebSocket(SERVER_URL);
ws.on('open', () => ws.send(ID));

ws.on('message', async function(data) {
    const msg = Message.decode(data);
    if (msg.type === Message.RUN) {
        const [cmd, ...opts] = parseCommand(msg.data);
        const subprocess = spawn(cmd, opts);
        subprocess.on('close', code => ws.send(Message.encode(Message.COMPLETE, code)));
        subprocess.stdout.on('data', data => ws.send(Message.encode(Message.STDOUT, data)));
        subprocess.stderr.on('data', data => ws.send(Message.encode(Message.STDERR, data)));
    } else if (msg.type === Message.ADD_ARTIFACT) {
        const [name, dataInfo, type, config={}] = msg.data;
        const dirs = ['artifacts', name];
        await mkdirp(...dirs);
        requirejs([
            './utils.build',
        ], function(
            Utils,
        ) {
            const {Storage} = Utils;

            async function saveArtifact() {
                let exitCode = 0;
                try {
                    const client = await Storage.getClient(dataInfo.backend, null, config);
                    const dataPath = path.join(...dirs.concat('data'));
                    const buffer = await client.getFile(dataInfo);
                    await fs.writeFile(dataPath, buffer);
                    const filePath = path.join(...dirs.concat('__init__.py'));
                    await fs.writeFile(filePath, initFile(name, type));
                } catch (err) {
                    exitCode = 1;
                    console.error(`addArtifact(${name}) failed:`, err);
                }
                ws.send(Message.encode(Message.COMPLETE, exitCode));
            }

            saveArtifact();
        });
    }
});

function parseCommand(cmd) {
    const chunks = [''];
    let quoteChar = null;
    for (let i = 0; i < cmd.length; i++) {
        const letter = cmd[i];
        const isQuoteChar = letter === '"' || letter === '\'';
        const isInQuotes = !!quoteChar;

        if (!isInQuotes && isQuoteChar) {
            quoteChar = letter;
        } else if (quoteChar === letter) {
            quoteChar = null;
        } else {
            const isNewChunk = letter === ' ' && !isInQuotes;
            if (isNewChunk) {
                chunks.push('');
            } else {
                const lastChunk = chunks[chunks.length - 1];
                chunks[chunks.length - 1] = lastChunk + letter;
            }
        }
    }
    return chunks;
}

async function mkdirp() {
    const dirs = Array.prototype.slice.call(arguments);
    await dirs.reduce(async (lastDirPromise, nextDir) => {
        const dir = path.join(await lastDirPromise, nextDir);
        try {
            await fs.mkdir(dir);
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
        return dir;
    }, process.cwd());
}

function initFile(name, type) {
    const dataPathCode = `path.join(path.dirname(__file__), 'data')`;
    return [
        'import deepforge',
        'from os import path',
        `name = '${name}'`,
        `type = '${type}'`,
        `data = deepforge.serialization.load('${type}', open(${dataPathCode}, 'rb'))`
    ].join('\n');
}
