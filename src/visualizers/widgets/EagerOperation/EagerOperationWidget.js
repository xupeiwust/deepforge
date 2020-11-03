/*globals define, $, WebGMEGlobal*/

define([
    'deepforge/globals',
    'deepforge/Constants',
    'widgets/InteractiveEditor/InteractiveEditorWidget',
    'widgets/OperationCodeEditor/OperationCodeEditorWidget',
    'widgets/TabbedTextEditor/TabbedTextEditorWidget',
    'widgets/TextEditor/TextEditorWidget',
    'widgets/OperationInterfaceEditor/OperationInterfaceEditorWidget',
    'css!./styles/EagerOperationWidget.css',
], function (
    DeepForge,
    Constants,
    InteractiveEditor,
    OperationCodeEditor,
    TabbedTextEditorWidget,
    TextEditorWidget,
    OperationInterfaceEditorWidget,
) {
    'use strict';

    const WIDGET_CLASS = 'eager-operation';
    class EagerOperationWidget extends InteractiveEditor {
        constructor(logger, container) {
            container.addClass(WIDGET_CLASS);
            super(container);
            this.width = 0;
            this.height = 0;

            const $leftPane = $('<div>', {class: 'pane'});
            container.append($leftPane);
            this.codeEditor = new OperationCodeEditor(logger, $leftPane);
            window.codeEditor = this.codeEditor;

            const $rightPane = $('<div>', {class: 'pane'});
            container.append($rightPane);
            this.secondaryEditor = this.initializeSecondaryEditor(logger, $rightPane);
            this.tabs.forEach(tab => this.secondaryEditor.addTab(tab));
        }

        initializeSecondaryEditor(logger, $el) {
            const config = {
                canCreateTabs: false,
                message: {
                    new: '',
                    empty: '',
                    rename: '',
                },
            };
            const widget = new TabbedTextEditorWidget(logger, $el, config);
            this.tabs = [];

            function newTab(name, $el, editor) {
                return {
                    id: name,
                    name: name,
                    supportedActions: {
                        delete: false,
                        rename: false,
                    },
                    editor,
                    $el,
                };
            }
            $el = $('<div>');
            let editor = new OperationInterfaceEditorWidget(logger, $el);
            this.tabs.push(newTab('Operation Interface', $el, editor));
            editor.isValidTerminalNode = () => true;
            this.operationInterface = editor;

            $el = $('<div>');
            editor = new TextEditorWidget(
                logger,
                $el,
                {language: 'yaml', displayMiniMap: false}
            );
            this.tabs.push(newTab('Environment', $el, editor));

            $el = $('<div>');
            editor = new TextEditorWidget(
                logger,
                $el,
                {language: 'plaintext'}
            );
            editor.setReadOnly(true);
            this.tabs.push(newTab('Console', $el, editor));

            widget.onTabSelected = id => {
                const tab = this.tabs.find(tab => tab.id === id);
                this.onTabSelected(widget, tab);
            };

            return widget;
        }

        setOperation(operation) {
            this.codeEditor.addNode({
                name: operation.name,
                text: operation.code,
            });
            const [interfaceTab, envTab] = this.tabs;
            const interfaceNodes = this.getOperationInterfaceNodes(operation);
            console.log('about to add', interfaceNodes);
            interfaceNodes.forEach(node => interfaceTab.editor.addNode(node));  // FIXME: this is overly simplistic...

            envTab.editor.addNode({name: operation.name, text: operation.env});
        }

        getOperationInterfaceNodes(operation) {
            //const displayColor = desc.attributes[CONSTANTS.OPERATION.DISPLAY_COLOR];
            //desc.displayColor = displayColor && displayColor.value;
            // TODO: Get the attributes and such
            // TODO: create the interface nodes
            console.log(operation);
            const Decorator = WebGMEGlobal.Client.decoratorManager.getDecoratorForWidget('OpIntDecorator', 'EasyDAG');
            const centralNode = operation;
            centralNode.Decorator = Decorator;
            //const 
            return [centralNode];
        }

        registerActions() {
            // TODO: use the operation name
            DeepForge.registerAction('Run operation', 'play_arrow', 10, () => this.onRunClicked());
        }

        onRunClicked() {
            // TODO: get the operation info
            this.runOperation(this.operation);
        }

        // TODO: add interface editor
        // TODO:   - add save button to outputs
        // TODO:   - add input operations (and outputs?)
        // TODO: add conda environment editor
        // TODO: add console output tab
        // TODO: add graphical output (controller?)
        // TODO: add "save" button for the operation definition

        onTabSelected(widget, tab) {
            widget.$tabContent.empty();
            widget.$tabContent.append(tab.$el);
            this.onWidgetContainerResize(this.width, this.height);
            tab.editor.onWidgetContainerResize();
        }

        onActivate() {
            this.codeEditor.onActivate();
            this.secondaryEditor.onActivate();
            this.tabs.forEach(tab => tab.editor.onActivate());
        }

        onWidgetContainerResize(width, height) {
            this.width = width;
            this.height = height;
            // TODO: get the right width/heights
            this.codeEditor.onWidgetContainerResize();
            this.secondaryEditor.onWidgetContainerResize();
        }

        destroy() {
            super.destroy();
            DeepForge.unregisterAction('Run operation', 'play_arrow', 10, () => this.runOperation());
        }
    }

    return EagerOperationWidget;
});
