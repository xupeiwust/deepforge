/* globals define, monaco*/
/* eslint-env browser */

define([
    'deepforge/gmeConfig',
], function (
    gmeConfig
) {
    const LanguageServersHelper = {
        isLanguageServerAvailable: function(language) {
            return !!gmeConfig.extensions.languageServers &&
                !!gmeConfig.extensions.languageServers.hostName &&
                gmeConfig.extensions.languageServers.servers.includes(language);
        },

        getInitializationOptionsFor: function(serverName) {
            if(Object.keys(this.servers).includes(serverName)) {
                return this.servers[serverName].init;
            }
        },
        getWorkspaceURIFor: function(serverName) {
            if(Object.keys(this.servers)) {
                return monaco.Uri.parse(
                    this.servers[serverName].workspace
                );
            }
        }
    };

    return LanguageServersHelper;
});
