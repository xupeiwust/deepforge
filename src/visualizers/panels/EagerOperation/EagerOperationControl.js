/*globals define */

define([
    'panels/InteractiveExplorer/InteractiveExplorerControl',
    'panels/OperationInterfaceEditor/OperationInterfaceEditorControl',
    'deepforge/viz/OperationControl',
    'deepforge/OperationCode',
    'panels/EasyDAG/EasyDAGControl',
    'underscore',
    'text!deepforge/NewOperationCode.ejs',
], function (
    InteractiveExplorerControl,
    OperationInterfaceControl,
    OperationControl,
    OperationCode,
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
            this.currentTrainTask = trainTask;
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
            widget.operationInterface.setAttributeMeta = this.setAttributeMeta.bind(this);
            widget.operationInterface.deleteAttribute = this.deleteAttribute.bind(this);
            widget.codeEditor.saveTextFor = this.saveTextFor.bind(this);
        }

        async runOperation(operation) {
            await this.addOperationCode(operation, this.session);
            // TODO: run the operation
            const self = this;
            return PromiseEvents.new(async function(resolve) {
                this.emit('update', 'Generating Code');
                await self.initTrainingCode(modelInfo);
                this.emit('update', 'Training...');
                const trainTask = self.session.spawn('python start_train.py');
                self.currentTrainTask = trainTask;
                self.currentTrainTask.on(Message.STDOUT, data => {
                    let line = data.toString();
                    if (line.startsWith(CONSTANTS.START_CMD)) {
                        line = line.substring(CONSTANTS.START_CMD.length + 1);
                        const splitIndex = line.indexOf(' ');
                        const cmd = line.substring(0, splitIndex);
                        const content = JSON.parse(line.substring(splitIndex + 1));
                        if (cmd === 'PLOT') {
                            this.emit('plot', content);
                        } else {
                            console.error('Unrecognized command:', cmd);
                        }
                    }
                });
                let stderr = '';
                self.currentTrainTask.on(Message.STDERR, data => stderr += data.toString());
                self.currentTrainTask.on(Message.COMPLETE, exitCode => {
                    if (exitCode) {
                        this.emit('error', stderr);
                    } else {
                        this.emit('end');
                    }
                    if (self.currentTrainTask === trainTask) {
                        self.currentTrainTask = null;
                    }
                    resolve();
                });
            });
            // TODO: initCode
            // TODO: load input data
            // TODO: upload data afterwards?
            const mainCode = ``;

            const trainTask = this.session.spawn('python start_train.py');
            this.currentTrainTask = trainTask;
            this.currentTrainTask.on(Message.STDOUT, data => {
                let line = data.toString();
                if (line.startsWith(CONSTANTS.START_CMD)) {
                    line = line.substring(CONSTANTS.START_CMD.length + 1);
                    const splitIndex = line.indexOf(' ');
                    const cmd = line.substring(0, splitIndex);
                    const content = JSON.parse(line.substring(splitIndex + 1));
                    if (cmd === 'PLOT') {
                        this.emit('plot', content);
                    } else {
                        console.error('Unrecognized command:', cmd);
                    }
                }
            });
            let stderr = '';
            this.currentTrainTask.on(Message.STDERR, data => stderr += data.toString());
            this.currentTrainTask.on(Message.COMPLETE, exitCode => {
                if (exitCode) {
                    this.emit('error', stderr);
                } else {
                    this.emit('end');
                }
                if (this.currentTrainTask === trainTask) {
                    this.currentTrainTask = null;
                }
                resolve();
            });
        }

        async addOperationCode(operation, session) {
            // TODO: create a new branch
            // TODO: save the operation
            // TODO: generate code from the operation
            // TODO: copy the generated files into the session
            // TODO: copy the artifacts into the session
            const {name, code} = operation;
            const filename = ;
            // TODO: Can I reuse some code from the operation plugin?
            const initCode = `from operations.${filename} import ${name}`;
            await this.session.addFile('operations/__init__.py', initCode);
            await this.session.addFile(`operations/${filename}.py`, code);
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
                attribute_meta: {},
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

        updateCode(fn) {
            this.operation.code = this.getUpdatedCode(
                this.operation.code,
                fn
            );
            // TODO: update the code
            this._widget.codeEditor.addNode({
                id: this.operation.id,
                name: this.operation.name,
                text: this.operation.code,
            });
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
                nodeName.toLowerCase(),
                this.operation.references.map(ref => ref.name)
            );
            const id = `ptr_${nodeName}_${counter()}`;
            const desc = {
                baseName: nodeName,
                name: name,
                Decorator: this._getNodeDecorator(node),
                id: id,
                isPointer: true,
                attributes: {},
                attribute_meta: {},
                isUnknown: false,
                conn: {
                    id: `conn_${counter()}`,
                    src: id,
                    dst: this.operation.id,
                }
            };
            this.operation.references.push(desc);
            this.addInterfaceNode(desc);
            this._widget.operationInterface.addConnection(desc.conn);
            this.updateCode(operation => operation.addReference(name));
        }

        removePtr(name) {
            this.removeInterfaceReference(name);
            this.updateCode(operation => operation.removeReference(name));
        }

        removeInterfaceReference(name) {
            const index = this.operation.references.findIndex(ref => ref.name === name);
            if (index > -1) {
                const [ptr] = this.operation.references.splice(index, 1);
                this._widget.operationInterface.removeNode(ptr.id);
                this._widget.operationInterface.removeNode(ptr.conn.id);
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

        newDataDesc(isInput, name) {
            const dataNode = this.client.getAllMetaNodes()
                .find(node => node.getAttribute('name') === 'Data');
            const Decorator = this._getNodeDecorator(dataNode);

            const nodes = isInput ? this.operation.inputs : this.operation.outputs;
            name = uniqueName(
                name || 'data',
                nodes.map(d => d.name)
            );

            const id = `data_${counter()}`;
            const dataDesc = {
                id,
                name,
                Decorator,
                attributes: {},
                attribute_meta: {},
                pointers: {},
                baseName: 'Data',
                container: isInput ? 'inputs' : 'outputs',
                isConnection: false,
                conn: {
                    id: `conn_${counter()}`,
                    src: isInput ? id : this.operation.id,
                    dst: isInput ? this.operation.id : id,
                }
            };
            return dataDesc;
        }

        createConnectedNode(typeId, isInput) {
            const {id, name} = this.addDataInterfaceNode(isInput);
            if (isInput) {
                this.updateCode(operation => operation.addInput(name));
            } else {
                this.updateCode(operation => operation.addOutput(name));
            }
            return id;
        }

        addDataInterfaceNode(isInput, name) {
            const dataDesc = this.newDataDesc(isInput, name);

            if (isInput) {
                this.operation.inputs.push(dataDesc);
            } else {
                this.operation.outputs.push(dataDesc);
            }
            this.addInterfaceNode(dataDesc);
            this._widget.operationInterface.addConnection(dataDesc.conn);
            return dataDesc;
        }

        deleteDataInterfaceNode(name) {
            const isInput = this.operation.inputs.find(desc => desc.name === name);
            const nodes = isInput ? this.operation.inputs :
                this.operation.outputs;
            const index = nodes.findIndex(desc => desc.name === name);
            if (index > -1) {
                const [desc] = nodes.splice(index, 1);
                this._widget.operationInterface.removeNode(desc.id);
                this._widget.operationInterface.removeNode(desc.conn.id);
            } else {
                throw new Error(`Could not find input/output node: ${name}`);
            }
        }

        deleteNode(id) {
            const isInput = this.operation.inputs.find(desc => desc.id === id);
            const nodes = isInput ? this.operation.inputs :
                this.operation.outputs;
            const index = nodes.findIndex(desc => desc.id === id);
            if (index > -1) {
                const [desc] = nodes.splice(index, 1);
                this._widget.operationInterface.removeNode(desc.id);
                this._widget.operationInterface.removeNode(desc.conn.id);
                if (isInput) {
                    this.updateCode(operation => operation.removeInput(desc.name));
                } else {
                    this.updateCode(operation => operation.removeOutput(desc.name));
                }
            } else {
                throw new Error(`Could not find input/output node: ${id}`);
            }
        }

        saveAttributeForNode(id, attr, value) {
            const desc = this.getDesc(id);
            if (attr === 'name') {
                const isEditingOperation = id === this.operation.id;
                const isRenamingRef = this.operation.references.includes(desc);
                if (isEditingOperation) {
                    this.updateCode(operation => operation.setName(value));
                } else if (isRenamingRef) {
                    this.updateCode(operation =>
                        operation.renameIn(OperationCode.CTOR_FN, desc.name, value));
                } else {
                    this.updateCode(operation => operation.rename(desc.name, value));
                }
                desc.name = value;
            } else {
                desc.attributes[attr].value = value;
                this.updateCode(operation => operation.setAttributeDefault(attr, value));
            }

            this.updateInterfaceNode(desc);
        }

        getValidAttributeNames(id) {
            const desc = this.getDesc(id);
            return Object.keys(desc.attribute_meta);
        }

        setAttributeMeta(id, _name, schema) {
            const {name} = schema;
            const desc = this.getDesc(id);
            desc.attribute_meta[name] = schema;
            desc.attributes[name] = {
                name,
                type: schema.type,
                values: schema.enumValues,
                value: schema.defaultValue,
            };
            this.updateInterfaceNode(desc);
        }

        deleteAttribute(id, name) {
            const desc = this.getDesc(id);
            delete desc.attribute_meta[name];
            delete desc.attributes[name];
            this.updateInterfaceNode(desc);
        }

        addInterfaceNode(desc) {
            this._widget.operationInterface.addNode(deepCopy(desc));
        }

        updateInterfaceNode(desc) {
            this._widget.operationInterface.updateNode(deepCopy(desc));
        }

        getDesc(id) {
            return this.getDescWith(desc => desc.id === id)
        }

        getDescWith(fn) {
            const desc = [
                ...this.operation.inputs,
                ...this.operation.outputs,
                ...this.operation.references,
                this.operation
            ].find(fn);
            return desc;
        }

        // Operation code editor
        saveTextFor(_id, code) {
            this.operation.code = code;
            const operation = OperationCode.findOperation(code);
            const refs = this.operation.references.map(desc => desc.name);

            this.operation.name = operation.getName();

            // update the attributes
            // check if the attributes have changed
            const allAttrs = operation.getAttributes();
            const removedAttrs = Object.values(this.operation.attributes)
                .filter(oldAttr => !allAttrs.find(attr => attr.name === oldAttr.name));

            const addAttrs = allAttrs.filter(attr => {
                const oldAttr = this.operation.attributes[attr.name];
                const isNewAttribute = !oldAttr;
                if (isNewAttribute) {
                    const isReference = refs.includes(attr.name);
                    return !isReference;
                }
                return false;
            });

            const changedAttrs = allAttrs.filter(attr => {
                const oldAttr = this.operation.attributes[attr.name];
                const isNewAttribute = !oldAttr;
                return !isNewAttribute && attr.value !== oldAttr.value;
            });

            // update the references (removal only)
            const rmRefs = _.difference(refs, allAttrs.map(attr => attr.name));

            const [addInputs, rmInputs] = this.listdiff(
                operation.getInputs().map(input => input.name),
                this.operation.inputs.map(input => input.name)
            );

            const [addOutputs, rmOutputs] = this.listdiff(
                operation.getOutputs().map(input => input.name),
                this.operation.outputs.map(input => input.name)
            );

            addAttrs.forEach(attr => {
                this.operation.attributes[attr.name].value = attr.value;
                console.log('adding', attr, 'what is the default value?');
                this.operation.attribute_meta[attr.name] = {
                    name: attr.name,
                    type: 'string',
                    defaultValue: attr.value,
                };
            });
            changedAttrs.forEach(attr =>
                this.operation.attributes[attr.name].value = attr.value
            );
            removedAttrs.forEach(attr => {
                delete this.operation.attribute_meta[attr.name];
                delete this.operation.attributes[attr.name];
            });

            rmRefs.forEach(name => this.removeInterfaceReference(name));

            addInputs.forEach(input => this.addDataInterfaceNode(true, input));
            addOutputs.forEach(name => this.addDataInterfaceNode(false, name));
            rmInputs.concat(rmOutputs)
                .forEach(name => this.deleteDataInterfaceNode(name));
            this.updateInterfaceNode(this.operation);
        }

        listdiff(l1, l2) {
            const newElements = _.difference(l1, l2);
            const oldElements = _.difference(l2, l1);
            return [newElements, oldElements];
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

    function deepCopy(data) {
        if (typeof data !== 'object') {
            return data;
        }
        return _.mapObject(data, deepCopy);
    }

    _.extend(EagerOperationControl.prototype, _.omit(OperationControl.prototype, 'updateCode'));

    return EagerOperationControl;
});
