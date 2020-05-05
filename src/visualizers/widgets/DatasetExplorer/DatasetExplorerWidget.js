/*globals define */

define([
    'deepforge/storage/index',
    'deepforge/compute/interactive/session',
    'widgets/PlotlyGraph/lib/plotly.min',
    'css!./styles/DatasetExplorerWidget.css'
], function (
    Storage,
    Session,
    Plotly,
) {
    'use strict';

    // TODO: Get access to the interactive compute
    var WIDGET_CLASS = 'dataset-explorer';

    class DatasetExplorerWidget {
        constructor(logger, container) {
            this._logger = logger.fork('Widget');

            this.$el = container;
            this.$el.addClass(WIDGET_CLASS);

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

        async getYValues (desc) {
            await this.session.whenConnected();

            // TODO: Ask if we should load the data?
            const dataInfo = JSON.parse(desc.data);
            const config = await this.getAuthenticationConfig(dataInfo);
            // TODO: Show loading message...
            await this.session.addArtifact('data', dataInfo, desc.type, config);
            const command = [
                'from artifacts.data import data',
                'import json',
                'print(json.dumps([l[0] for l in data["y"]]))'
            ].join(';');
            const {stdout} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            return JSON.parse(stdout);
        }

        async getPlotData (desc) {
            return [
                {
                    y: await this.getYValues(desc),
                    boxpoints: 'all',
                    jitter: 0.3,
                    pointpos: -1.8,
                    type: 'box'
                }
            ];
        }

        onWidgetContainerResize (/*width, height*/) {
            this._logger.debug('Widget is resizing...');
        }

        // Adding/Removing/Updating items
        async addNode (desc) {
            this.nodeId = desc.id;
            const plotData = await this.getPlotData(desc);
            const isStillShown = this.nodeId === desc.id;
            if (isStillShown) {
                const title = `Distribution of Labels for ${desc.name}`;
                Plotly.newPlot(this.$el[0], plotData, {title});
            }
        }

        removeNode (/*gmeId*/) {
        }

        updateNode (/*desc*/) {
        }

        /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
        destroy () {
            Plotly.purge(this.$el[0]);
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
