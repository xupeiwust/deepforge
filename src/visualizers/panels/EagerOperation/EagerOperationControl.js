/*globals define */

define([
    'panels/InteractiveExplorer/InteractiveExplorerControl',
    'underscore',
    'text!deepforge/NewOperationCode.ejs',
], function (
    InteractiveExplorerControl,
    _,
    NewOperationCodeTxt,
) {

    'use strict';

    const GetOperationCode = _.template(NewOperationCodeTxt);
    class EagerOperationControl extends InteractiveExplorerControl {

        constructor() {
            super(...arguments);
            const operation = this.getInitialOperation();
            this._widget.setOperation(operation);
        }

        getInitialOperation() {
            const basename = 'NewOperation';
            let name = basename;
            let i = '2';
            const metanodes = Object.values(this.client.getAllMetaNodes());
            while (metanodes.find(node => node.getAttribute('name') === name)) {
                name = name + i++;
            }

            const code = GetOperationCode({name});

            return {
                name: name,
                inputs: [],
                outputs: [],
                references: [],
                code,
                env: ''
            };
        }

        async onComputeInitialized(session) {
            await super.onComputeInitialized(session);
            this._widget.registerActions();
        }
    }

    return EagerOperationControl;
});
