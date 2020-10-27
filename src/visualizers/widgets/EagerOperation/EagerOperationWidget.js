/*globals define */

define([
    'widgets/InteractiveEditor/InteractiveEditorWidget',
], function (
    InteractiveEditor,
) {
    'use strict';

    const WIDGET_CLASS = 'eager-operation';
    class EagerOperationWidget extends InteractiveEditor {
        constructor(logger, container) {
            container.addClass(WIDGET_CLASS);
            super(container);
        }
        // TODO: embed another widget
    }

    return EagerOperationWidget;
});
