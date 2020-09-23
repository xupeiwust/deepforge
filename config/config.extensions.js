const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');

const SERVERS_YML = path.join(__dirname, '..', 'language-servers.yml');

function getAvailableLanguageServers () {
    const parsed = yaml.safeLoad(fs.readFileSync(SERVERS_YML));
    return parsed.langservers ? Object.keys(parsed.langservers): [];
}

function getWorkspaceURIs() {
    const availableServers = getAvailableLanguageServers();
    const workspaces = {};
    availableServers.forEach(server => {
        workspaces[server] = `file:///tmp/${server}-models/`;
    });
    return workspaces;
}

module.exports = config => {
    config.extensions = {};
    config.extensions.InteractiveComputeHost = process.env.DEEPFORGE_INTERACTIVE_COMPUTE_HOST;
    config.extensions.languageServers = {
        host: process.env.DEEPFORGE_LANGUAGE_SERVER_HOST,
        servers: getAvailableLanguageServers(),
        workspaceURIs: getWorkspaceURIs(),
    };
    return config;
};
