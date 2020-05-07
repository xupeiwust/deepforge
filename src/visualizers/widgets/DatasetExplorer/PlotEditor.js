/* globals define, $ */
define([
    'underscore',
    'deepforge/EventEmitter',
    'text!./PlotEditor.html',
], function(
    _,
    EventEmitter,
    PlotEditorHtml,
) {

    class PlotEditor extends EventEmitter {
        constructor(container) {
            super();
            this.$el = container;
            this.$el.append($(PlotEditorHtml));

            const dataFields = ['title', 'xaxis', 'yaxis'];
            this.$elements = {};
            dataFields.forEach(name => {
                this.$elements[name] = this.$el.find(`#${name}`);
            });

            this.$update = this.$el.find('button');
            this.$update.on('click', event => {
                this.updateClicked();
                event.preventDefault();
                event.stopPropagation();
            });
        }

        set(values) {
            Object.entries(this.$elements).map(entry => {
                const [name, element] = entry;
                if (values.hasOwnProperty(name)) {
                    element.val(values[name]);
                }
            });
        }

        data() {
            const entries = Object.entries(this.$elements).map(entry => {
                const [name, element] = entry;
                const value = element.val();
                return [name, value];
            });
            return _.object(entries);
        }

        updateClicked() {
            const values = this.data();
            this.emit('update', values);
        }
    }
    // TODO: add input for title value
    // TODO: add input for labels
    // TODO: add input for data?

    return PlotEditor;
});
