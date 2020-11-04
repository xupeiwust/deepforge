/*globals define */

define([
    'panels/InteractiveExplorer/InteractiveExplorerControl',
    'panels/OperationInterfaceEditor/OperationInterfaceEditorControl',
    'deepforge/viz/OperationControl',
    'panels/EasyDAG/EasyDAGControl',
    'underscore',
    'text!deepforge/NewOperationCode.ejs',
], function (
    InteractiveExplorerControl,
    OperationInterfaceControl,
    OperationControl,
    EasyDAGControl,
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
            this.DEFAULT_DECORATOR = 'OpIntDecorator';
        }

        initializeWidgetHandlers (widget) {
            super.initializeWidgetHandlers(widget);
            widget.runOperation = operation => this.runOperation(operation);
            widget.operationInterface.allValidReferences = () => this.allValidReferences();
            widget.operationInterface.addRefTo = this.addRefTo.bind(this);
            widget.operationInterface.removePtr = this.removePtr.bind(this);
            widget.operationInterface.getValidSuccessors = this.getValidSuccessors.bind(this);
            widget.operationInterface.createConnectedNode = this.createConnectedNode.bind(this);
            widget.operationInterface.deleteNode = this.deleteNode.bind(this);
            widget.operationInterface.saveAttributeForNode = this.saveAttributeForNode.bind(this);
            widget.operationInterface.getValidAttributeNames = this.getValidAttributeNames.bind(this);
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

        onOperationInterfaceUpdate() {
            // TODO: Update the
        }

        setOperationCode(newCode) {
            // TODO: Update the operation inputs, outputs, etc
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

        getDescColor() {  // FIXME: this shouldn't be here... A bit of a code smell
            return OperationInterfaceControl.prototype.getDescColor.call(this, ...arguments);
        }

        isUsedInput() {  // FIXME: this shouldn't be here... A bit of a code smell
            return true;
        }

        isUsedOutput() {  // FIXME: this shouldn't be here... A bit of a code smell
            return true;
        }

        addRefTo(refId) {
            const node = this.client.getNode(refId);
            const nodeName = node.getAttribute('name');
            const name = uniqueName(
                nodeName,
                this.operation.references.map(ref => ref.name)
            );
            const id = `ptr_${nodeName}_${counter()}`;
            const desc = {
                baseName: nodeName,
                name: name.toLowerCase(),
                Decorator: this._getNodeDecorator(node),
                id: id,
                isPointer: true,
                attributes: {},
                isUnknown: false,
                conn: {
                    id: `conn_${counter()}`,
                    src: id,
                    dst: this.operation.id,
                }
            };
            this.operation.references.push(desc);
            this._widget.operationInterface.addNode(desc);
            this._widget.operationInterface.addConnection(desc.conn);
            this.onOperationInterfaceUpdate();
        }

        removePtr(name) {
            const index = this.operation.references.findIndex(ref => ref.name === name);
            if (index > -1) {
                const [ptr] = this.operation.references.splice(index, 1);
                this._widget.operationInterface.removeNode(ptr.id);
                this._widget.operationInterface.removeNode(ptr.conn.id);
                this.onOperationInterfaceUpdate();
            } else {
                throw new Error(`Could not find reference: ${name}`);
            }
        }

        getValidSuccessors(id) {
            if (id !== this.operation.id) {
                return [];
            }

            const nodeId = this.getDataTypeId();
            return [{
                node: this._getObjectDescriptor(nodeId)
            }];
        }

        _getObjectDescriptor(gmeId) {
            const desc = EasyDAGControl.prototype._getObjectDescriptor.call(this, gmeId);
            if (desc.id !== this._currentNodeId && this.containedInCurrent(gmeId)) {
                var cntrType = this._client.getNode(desc.parentId).getMetaTypeId();
                var cntr = this._client.getNode(cntrType).getAttribute('name');

                desc.container = cntr.toLowerCase();
                desc.isInput = desc.container === 'inputs';
                desc.attributes = {};
                desc.pointers = {};

            } else if (desc.id === this._currentNodeId) {
                desc.pointers = {};

                // Remove DeepForge hidden attributes
                const displayColor = desc.attributes[CONSTANTS.OPERATION.DISPLAY_COLOR];
                desc.displayColor = displayColor && displayColor.value;

                CONSTANTS.OPERATION.RESERVED_ATTRS
                    .filter(attrName => attrName !== 'name')
                    .forEach(name => delete desc.attributes[name]);
            }

            // Extra decoration for data
            if (this.hasMetaName(desc.id, 'Data', true)) {
                desc.used = true;
                desc.color = this.getDescColor(gmeId);
            }
            return desc;
        }

        createConnectedNode(typeId, isInput) {
            const node = this.client.getNode(typeId);
            const nodes = isInput ? this.operation.inputs : this.operation.outputs;
            const name = uniqueName(
                'data',
                nodes.map(d => d.name)
            );
            const id = `data_${counter()}`;
            const dataDesc = {
                id,
                name,
                Decorator: this._getNodeDecorator(node),
                attributes: {},
                pointers: {},
                baseName: 'Data',
                container: isInput ? 'inputs' : 'outputs',
                isConnection: false,
                conn: {
                    id: `conn_${counter()}`,
                    src: null,
                    dst: null,
                }
            };
            if (isInput) {
                dataDesc.conn.src = id;
                dataDesc.conn.dst = this.operation.id;
                this.operation.inputs.push(dataDesc);
            } else {
                dataDesc.conn.src = this.operation.id;
                dataDesc.conn.dst = id;
                this.operation.outputs.push(dataDesc);
            }
            // FIXME: move this to the widget?
            this._widget.operationInterface.addNode(dataDesc);
            this._widget.operationInterface.addConnection(dataDesc.conn);
            this.onOperationInterfaceUpdate();
            return dataDesc.id;
        }

        deleteNode(id) {
            const nodes = this.operation.inputs.find(desc => desc.id === id) ?
                this.operation.inputs : this.operation.outputs;
            const index = nodes.findIndex(desc => desc.id === id);
            if (index > -1) {
                const [desc] = nodes.splice(index, 1);
                this._widget.operationInterface.removeNode(desc.id);
                this._widget.operationInterface.removeNode(desc.conn.id);
                this.onOperationInterfaceUpdate();
            } else {
                throw new Error(`Could not find input/output node: ${id}`);
            }
        }

        saveAttributeForNode(id, attr, value) {
            const desc = _.clone([
                ...this.operation.inputs,
                ...this.operation.outputs,
                ...this.operation.references,
                this.operation
            ].find(desc => desc.id === id));
            if (attr === 'name') {
                desc.name = value;
            }

            desc.attributes[attr] = value;
            this._widget.operationInterface.updateNode(desc);
            this.onOperationInterfaceUpdate();
        }

        getValidAttributeNames() {
            console.log('getValidAttributeNames', arguments);
        }
    }

    class InMemoryOperationInterfaceControl {
        // TODO: Use this?
    }

    function uniqueName(basename, names) {
        let counter = 1;
        let name = basename;
        while (names.includes(name)) {
            name = `${name}_${counter++}`;
        }
        return name;
    }

    _.extend(EagerOperationControl.prototype, OperationControl.prototype);

    return EagerOperationControl;
});
