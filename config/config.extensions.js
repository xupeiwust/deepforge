const components = require('./components.json');

function getLanguageServersConfig () {
    if(components.LanguageServers) {
        return {
            hostName: components.LanguageServers.hostName || process.env.DEEPFORGE_LANGAUGE_SERVER_HOST,
            servers: components.LanguageServers.servers
        };
    }
}


module.exports = config => {
    config.extensions = {};
    config.extensions.InteractiveComputeHost = process.env.DEEPFORGE_INTERACTIVE_COMPUTE_HOST;
    return config;
};
