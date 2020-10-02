const components = require('./components.json');

function getLanguageServersConfig () {
    if(components.LanguageServers) {
        return {
            hostName: process.env.DEEPFORGE_LANGUAGE_SERVER_HOST || components.LanguageServers.hostName,
            servers: components.LanguageServers.servers
        };
    }
}


module.exports = config => {
    config.extensions = {};
    config.extensions.InteractiveComputeHost = process.env.DEEPFORGE_INTERACTIVE_COMPUTE_HOST;
    config.extensions.LanguageServers = getLanguageServersConfig();
    return config;
};
