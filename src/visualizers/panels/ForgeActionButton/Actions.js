/*globals define*/
// These are actions defined for specific meta types. They are evaluated from
// the context of the ForgeActionButton
define([], function() {
    var createNewArchitecture = function() {
        return createNew.call(this, 'Architecture');
    };

    var createNewPipeline = function() {
        return createNew.call(this, 'Pipeline');
    };

    var createNew = function(type) {
        // Create CNN node in the current dir
        // Get CNN node type
        var parentId = this._currentNodeId,
            baseId = this.client.getAllMetaNodes()
                .find(node => node.getAttribute('name') === type)
                .getId();

        this.client.createChild({parentId, baseId});
    };

    // Add download model button
    var downloadButton = function() {
        var id = this._currentNodeId,
            node = this.client.getNode(id),
            hash = node.getAttribute('data');

        if (hash) {
            return '/rest/blob/download/' + hash;
        }
        return null;
    };

    return {
        Data: [
            {
                name: 'Download',
                icon: 'play_for_work',
                href: downloadButton  // function to create href url
            }
        ],

        Pipelines: [
            {
                name: 'Create new pipeline',
                icon: 'queue',
                action: createNewPipeline
            }
        ],
        Architectures: [
            {
                name: 'Create new architecture',
                icon: 'queue',
                action: createNewArchitecture
            }
        ]
    };
});
