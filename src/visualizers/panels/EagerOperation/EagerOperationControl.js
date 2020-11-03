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

    let counter = (function() {
        let c = 1;
        return () => c++;
    })();
    const GetOperationCode = _.template(NewOperationCodeTxt);
    class EagerOperationControl extends InteractiveExplorerControl {

        constructor() {
            super(...arguments);
            this._client = this.client;
            this.operation = this.getInitialOperation();
            this._widget.setOperation(this.operation);
            this.DEFAULT_DECORATOR = 'EllipseDecorator';
        }

        initializeWidgetHandlers (widget) {
            super.initializeWidgetHandlers(widget);
            widget.runOperation = operation => this.runOperation(operation);
            widget.operationInterface.allValidReferences = () => this.allValidReferences();
            widget.operationInterface.addRefTo = this.addRefTo.bind(this);
            widget.operationInterface.removePtr = this.removePtr.bind(this);
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
                id: `operation_${counter()}`,
                name: name,
                baseName: 'Operation',
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

        // Operation interface functions
        getResourcesNodeTypes() {
            return OperationInterfaceControl.prototype.getResourcesNodeTypes.call(this);
        }

        allValidReferences() {
            return this.getResourcesNodeTypes().map(node => ({
                node: OperationInterfaceControl.prototype._getObjectDescriptor.call(this, node.getId())
            }));
        }

        _getNodeDecorator() {  // FIXME: this shouldn't be here... A bit of a code smell
            return OperationInterfaceControl.prototype._getNodeDecorator.call(this, ...arguments);
        }

        containedInCurrent() {  // FIXME: this shouldn't be here... A bit of a code smell
            return OperationInterfaceControl.prototype.containedInCurrent.call(this, ...arguments);
        }

        hasMetaName() {  // FIXME: this shouldn't be here... A bit of a code smell
            return OperationInterfaceControl.prototype.hasMetaName.call(this, ...arguments);
        }

        addRefTo(refId) {
            const node = this.client.getNode(refId);
            const nodeName = node.getAttribute('name');
            const name = uniqueName(
                nodeName,
                this.operation.references.map(ref => ref.name)
            );
            const desc = {
                baseName: nodeName,
                name: name.toLowerCase(),
                Decorator: this._getNodeDecorator(node),
                id: `ptr_${nodeName}_${counter()}`,
                isPointer: true,
                attributes: {},
                isUnknown: false,
                connId: `conn_${counter()}`,
            };
            this.operation.references.push(desc);
            this._widget.operationInterface.addNode(desc);
            this.createConnection(desc);
        }

        createConnection(desc) {
            const conn = {};
            conn.id = desc.connId;

            if (desc.container === 'outputs') {
                conn.src = this.operation.id;
                conn.dst = desc.id;
            } else {
                conn.src = desc.id;
                conn.dst = this.operation.id;
            }
            this._widget.operationInterface.addConnection(conn);

            return conn;
        }

        removePtr(name) {
            const index = this.operation.references.findIndex(ref => ref.name === name);
            if (index > -1) {
                const [ptr] = this.operation.references.splice(index, 1);
                this._widget.operationInterface.removeNode(ptr.id);

                // and connection
                this._widget.operationInterface.removeNode(ptr.connId);

            } else {
                throw new Error(`Could not find reference: ${name}`);
            }
        }
    }

    function uniqueName(basename, names) {
        let counter = 1;
        let name = basename;
        while (names.includes(name)) {
            name = `${name}_${counter++}`;
        }
        return name;
    }

    return EagerOperationControl;
});
