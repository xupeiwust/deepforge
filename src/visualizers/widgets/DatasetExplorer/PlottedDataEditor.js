/* globals define, $ */
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
            const $dataDropdown = this.$el.find('#data');
            this.setDataOptions($dataDropdown, dataShapes);
            $dataDropdown.on('change', onDataUpdate);

            this.$dataDims = this.$el.find('#dataDims');
        }

        setDataOptions($data, dataShapes) {
            $data.empty();
            const names = dataShapes
                .flatMap(md => PlottedDataEditor.getAllVariableNames(md));
            const options = names.map(name => {
                const $el = $('<option>');
                $el.attr('value', name);
                $el.text(name);
                return $el;
            });
            options.forEach($opt => $data.append($opt));
        }

        static getAllVariableNames(metadata, isKey=false) {
            const name = isKey ? `['${metadata.name}']` : metadata.name;  // TODO: bug if not escaping "'"

            if (metadata.entries) {
                const names = metadata.entries
                    .flatMap(entry => PlottedDataEditor.getAllVariableNames(entry, true));

                return names.map(n => name + n);
            }

            return [name];
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

        data(shallow) {
            const data = super.data();
            data.id = this.id;
            if (!shallow) {
                data.shape = this.getPythonDataShape();
            }
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
            const {data, dataSlice=''} = this.data(true);
            const startShape = this.getInitialDataShape(data);
            const shape = PythonSliceParser(startShape, dataSlice);
            return shape;
        }
    }

    return PlottedDataEditor;
});
