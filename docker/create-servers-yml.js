const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const langServers = require(path.resolve(__dirname, '..', 'utils', 'languageServers'));

function dumpLangServerYaml(fileName) {
    const serversYml = {
        langservers: {}
    };

    Object.keys(langServers.servers).forEach(server => {
        const command = langServers.servers[server].command;
        serversYml.langservers[server] = Array.isArray(command) ? command : [command];
    });

    fs.writeFileSync(fileName, yaml.safeDump(serversYml));
}


if (require.main === module) {
    dumpLangServerYaml('languageServers.yml');
}
