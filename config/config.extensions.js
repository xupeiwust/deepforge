const yaml = require('js-yaml');
const components = require('components.json');

function getLanguageServersConfig () {
    if(components.languageServers) {
        const servers = components.languageServers;
        servers.hostName = process.env.DEEPFORGE_LANGAUGE_SERVER_HOST;
        return servers;
    }
}

module.exports = config => {
    config.extensions = {};
    config.extensions.InteractiveComputeHost = process.env.DEEPFORGE_INTERACTIVE_COMPUTE_HOST;
    config.extensions.languageServers = getLanguageServersConfig();
    return config;
};
