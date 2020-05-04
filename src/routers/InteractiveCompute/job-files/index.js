/* globals requireJS */
const Files = requireJS('deepforge/plugin/GeneratedFiles');
const fs = require('fs');
const path = require('path');
const START_SESSION = fs.readFileSync(path.join(__dirname, 'start-session.js'), 'utf8');
const interactiveDir = path.join(__dirname, '..', '..', '..', 'common', 'compute', 'interactive');
const MESSAGE = fs.readFileSync(path.join(interactiveDir, 'message.js'), 'utf8');

class StartSessionFiles extends Files {
    constructor(blobClient, url, id) {
        super(blobClient);
        this.id = id;
        this.createFiles(url, id);
    }

    createFiles(url, id) {
        const config = JSON.stringify({
            cmd: 'node',
            args: ['start-session.js', url, id],
            outputInterval: -1,
            resultArtifacts: []
        }, null, 2);
        this.addFile('executor_config.json', config);
        this.addFile('start-session.js', START_SESSION);
        this.addFile('message.js', MESSAGE);
    }

    async upload() {
        const name = `interactive-session-init-${this.id}`;
        return await this.save(name);
    }
}

module.exports = StartSessionFiles;
