/* globals define */
define([
    'underscore',
    './DataEditorBase',
    './PythonSliceParser',
    'text!./PlottedDataEditor.html',
], function(
    _,
    DataEditorBase,
    PythonSliceParser,
    Html,
) {

    Html = _.template(Html);
    class PlottedDataEditor extends DataEditorBase {
        constructor(plottedData, dataShapes) {
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
            const onDataUpdate = _.debounce(() => this.onPythonDataUpdate(), 250);
            this.dataShapes = dataShapes;
            this.$el.find('#dataSlice').on('input', onDataUpdate);
            this.$el.find('#data').on('change', onDataUpdate);

            this.$dataDims = this.$el.find('#dataDims');
        }

        async show() {
            this.$el.modal('show');
            this.onPythonDataUpdate();
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

        onPythonDataUpdate() {
            try {
                const shape = this.getPythonDataShape();
                const displayShape = `(${shape.join(', ')})`;
                this.$dataDims.text(displayShape);
                this.$elements.dataSlice.parent().removeClass('has-error');
            } catch (err) {
                this.$elements.dataSlice.parent().addClass('has-error');
                this.$dataDims.text(err.message);
            }
        }

        findMetadataEntry(metadata, varName) {
            if (varName === metadata.name) {
                return metadata;
            }

            const isDict = !!metadata.entries;
            if (isDict && varName.startsWith(metadata.name)) {
                const nextEntry = metadata.entries
                    .find(md => {
                        const {name} = md;
                        const entryVarName = `${metadata.name}['${name}']`;

                        return varName.startsWith(entryVarName);
                    });

                const relVarName = varName
                    .replace(`${metadata.name}['${nextEntry.name}']`, nextEntry.name);
                return this.findMetadataEntry(nextEntry, relVarName);
            }
        }

        getInitialDataShape(nameString) {
            const metadata = this.dataShapes
                .map(metadata => this.findMetadataEntry(metadata, nameString))
                .find(md => md);

            if (!metadata) {
                throw new Error(`Could not find metadata for ${nameString}`);
            }

            return metadata.shape;
        }

        getPythonDataShape() {
            const {data, dataSlice=''} = this.data();
            const startShape = this.getInitialDataShape(data);
            const shape = PythonSliceParser(startShape, dataSlice);
            return shape;
        }
    }

    return PlottedDataEditor;
});
