/*globals define */

define([
    'panels/InteractiveExplorer/InteractiveExplorerControl',
    'panels/OperationInterfaceEditor/OperationInterfaceEditorControl',
    'underscore',
    'text!deepforge/NewOperationCode.ejs',
], function (
    InteractiveExplorerControl,
    OperationInterfaceControl,
    _,
    NewOperationCodeTxt,
) {

    'use strict';

    const GetOperationCode = _.template(NewOperationCodeTxt);
    class EagerOperationControl extends InteractiveExplorerControl {

        constructor() {
            super(...arguments);
            this._client = this.client;
            const operation = this.getInitialOperation();
            this._widget.setOperation(operation);
        }

        initializeWidgetHandlers (widget) {
            super.initializeWidgetHandlers(widget);
            widget.runOperation = operation => this.runOperation(operation);
            widget.operationInterface.allValidReferences = () => this.allValidReferences();
        }

        getResourcesNodeTypes() {
            return OperationInterfaceControl.prototype.getResourcesNodeTypes.call(this);
        }

        allValidReferences() {
            return this.getResourcesNodeTypes().map(node => ({
                node: OperationInterfaceControl.prototype._getObjectDescriptor.call(this, node.getId())
            }));
        }

        runOperation(operation) {
            // TODO:
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
                attributes: {},
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
