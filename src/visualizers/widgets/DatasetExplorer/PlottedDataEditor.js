/* globals define */
define([
    'underscore',
    './DataEditorBase',
    'text!./PlottedDataEditor.html',
], function(
    _,
    DataEditorBase,
    Html,
) {

    Html = _.template(Html);
    class PlottedDataEditor extends DataEditorBase {
        constructor(plottedData) {
            const isNewData = !plottedData;
            const title = isNewData ? `Add data to figure` :
                `Edit "${plottedData.name}"`;  // FIXME: fix capitalization?

            super(Html({title}), ['id', 'name', 'data', 'dataSlice']);

            if (!isNewData) {
                this.set(plottedData);
                this.id = plottedData.id;
            } else {
                this.id = Date.now();
            }

            this.$update = this.$el.find('.btn-primary');
        }

        async show() {
            this.$el.modal('show');
            return new Promise(resolve => {
                this.$update.on('click', event => {
                    this.$el.modal('hide');
                    event.stopPropagation();
                    event.preventDefault();
                    resolve(this.data());
                });
            });
        }

        data() {
            const data = super.data();
            data.id = this.id;
            return data;
        }
    }

    return PlottedDataEditor;
});
