/*globals define, */

define([
    'panels/InteractiveEditor/InteractiveEditorPanel',
    'widgets/EagerOperation/EagerOperationWidget',
    './EagerOperationControl'
], function (
    InteractiveEditorPanel,
    EagerOperationWidget,
    EagerOperationControl
) {
    'use strict';

    class EagerOperationPanel extends InteractiveEditorPanel {
        constructor(layoutManager, params) {
            const config = {
                name: 'EagerOperation',
                Control: EagerOperationControl,
                Widget: EagerOperationWidget,
            };
            super(config, params);

            this.logger.debug('ctor finished');
        }
    }

    return EagerOperationPanel;
});
