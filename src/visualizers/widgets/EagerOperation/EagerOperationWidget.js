/*globals define, $, WebGMEGlobal*/

define([
    'deepforge/globals',
    'widgets/InteractiveEditor/InteractiveEditorWidget',
    'widgets/OperationCodeEditor/OperationCodeEditorWidget',
    'widgets/TabbedTextEditor/TabbedTextEditorWidget',
    'widgets/TextEditor/TextEditorWidget',
    'widgets/OperationInterfaceEditor/OperationInterfaceEditorWidget',
    'css!./styles/EagerOperationWidget.css',
], function (
    DeepForge,
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

            const $rightPane = $('<div>', {class: 'pane'});
            container.append($rightPane);
            this.secondaryEditor = this.initializeSecondaryEditor(logger, $rightPane);
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
            this.tabs.push(newTab('Console', $el, editor));

            widget.onTabSelected = id => {
                const tab = this.tabs.find(tab => tab.id === id);
                this.onTabSelected(widget, tab);
            };
            this.tabs.forEach(tab => widget.addTab(tab));

            return widget;
        }

        setOperation(operation) {
            this.codeEditor.addNode({
                name: operation.name,
                text: operation.code,
            });
            const [interfaceTab, envTab] = this.tabs;
            // TODO: update the interface editor

            envTab.editor.addNode({name: operation.name, text: operation.env});
        }

        registerActions() {
            // TODO: use the operation name
            DeepForge.registerAction('Run operation', 'play_arrow', 10, () => this.runOperation());
        }

        runOperation() {
            console.log('running operation!');  // TODO
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
            const isDisplayed = this.width && this.height;
            if (isDisplayed) {
                this.onWidgetContainerResize(this.width, this.height);
            }
        }

        onActivate() {
            this.codeEditor.onActivate();
            this.secondaryEditor.onActivate();
        }

        onWidgetContainerResize(width, height) {
            this.width = width;
            this.height = height;
        }

        destroy() {
            super.destroy();
            DeepForge.unregisterAction('Run operation', 'play_arrow', 10, () => this.runOperation());
        }
    }

    return EagerOperationWidget;
});
