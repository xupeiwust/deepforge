/*globals define, $ */

define([
    'deepforge/storage/index',
    'deepforge/compute/interactive/session',
    'widgets/PlotlyGraph/lib/plotly.min',
    './PlotEditor',
    'underscore',
    'css!./styles/DatasetExplorerWidget.css',
], function (
    Storage,
    Session,
    Plotly,
    PlotEditor,
    _,
) {
    'use strict';

    const WIDGET_CLASS = 'dataset-explorer';

    class DatasetExplorerWidget {
        constructor(logger, container) {
            this._logger = logger.fork('Widget');

            this.$el = container;
            this.$el.addClass(WIDGET_CLASS);
            const row = $('<div>', {class: 'row'});
            this.$el.append(row);

            this.$plot = $('<div>', {class: 'plot col-9'});
            this.$plotEditor = $('<div>', {class: 'plot-editor col-3'});
            this.plotEditor = new PlotEditor(this.$plotEditor);
            this.plotEditor.on('update', values => {
                // TODO: fetch the layout values and the data values
                console.log('update:', values);
                //this.setLayout(values);
            });

            row.append(this.$plot);
            row.append(this.$plotEditor);

            this.session = new Session('local');
            this.nodeId = null;

            this._logger.debug('ctor finished');
        }

        async getAuthenticationConfig (dataInfo) {
            const {backend} = dataInfo;
            const metadata = Storage.getStorageMetadata(backend);
            metadata.configStructure = metadata.configStructure
                .filter(option => option.isAuth);

            if (metadata.configStructure.length) {
                const configDialog = this.getConfigDialog();
                const title = `Authenticate with ${metadata.name}`;
                const iconClass = `glyphicon glyphicon-download-alt`;
                const config = await configDialog.show(metadata, {title, iconClass});

                return config[backend];
            }
        }

        async importDataToSession (desc) {
            await this.session.whenConnected();

            // TODO: Ask if we should load the data?
            const dataInfo = JSON.parse(desc.data);
            const config = await this.getAuthenticationConfig(dataInfo);

            // TODO: Show loading message...
            const name = desc.name.replace(/[^a-zA-Z_]/g, '_');
            await this.session.addArtifact(name, dataInfo, desc.type, config);
        }

        async getYValues (desc) {
            const name = desc.name.replace(/[^a-zA-Z_]/g, '_');
            return [1,2,3,4];
            await this.importDataToSession(desc);

            const command = [
                `from artifacts.${name} import data`,
                'import json',
                'print(json.dumps([l[0] for l in data["y"]]))'
            ].join(';');
            const {stdout} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            return JSON.parse(stdout);
        }

        async getMetadata (desc) {
            // TODO: Load the data into the current session
            return {
                name: desc.name,
                data: {
                    X: [7500, 64, 64, 5],
                    y: [7500, 1]
                }
            };
        }

        async getPlotData (desc) {
            return [
                {
                    y: await this.getYValues(desc),
                    boxpoints: 'all',
                    jitter: 0.3,
                    pointpos: -1.8,
                    name: `${desc.name}['y']`,
                    type: 'box'
                }
            ];
        }

        onWidgetContainerResize (/*width, height*/) {
            this._logger.debug('Widget is resizing...');
        }

        defaultLayout(desc) {
            const title = `Distribution of Labels for ${desc.name}`;
            return {title};
        }

        setLayout(newVals) {
            this.layout = newVals;
            this.onPlotUpdated();
        }

        onPlotUpdated () {
            Plotly.newPlot(this.$plot[0], this.plotData, this.layout);
        }

        // Adding/Removing/Updating items
        async addNode (desc) {
            this.nodeId = desc.id;
            // TODO: Use a different method of storing what to plot
            this.plotData = await this.getPlotData(desc);
            const isStillShown = this.nodeId === desc.id;
            // getMetadata 
            if (isStillShown) {
                this.layout = this.defaultLayout(desc);
                const data = _.extend({}, this.layout);
                data.plottedData = [  // FIXME: remove this 
                    {
                        id: 123,
                        name: 'Example Data',
                        data: `combined_dataset['y']`,
                        dataSlice: '[:,0]',
                    }
                ];
                this.plotEditor.set(data);
                this.onPlotUpdated();
                //Plotly.newPlot(this.$plot[0], this.plotData, this.layout);
            }
        }

        removeNode (/*gmeId*/) {
        }

        updateNode (/*desc*/) {
        }

        /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
        destroy () {
            Plotly.purge(this.$plot[0]);
            this.session.close();
        }

        onActivate () {
            this._logger.debug('DatasetExplorerWidget has been activated');
        }

        onDeactivate () {
            this._logger.debug('DatasetExplorerWidget has been deactivated');
        }
    }

    return DatasetExplorerWidget;
});
