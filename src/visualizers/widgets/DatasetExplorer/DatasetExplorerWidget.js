/*globals define, $ */

define([
    'deepforge/storage/index',
    'deepforge/compute/interactive/session',
    'widgets/PlotlyGraph/lib/plotly.min',
    './PlotEditor',
    './ArtifactLoader',
    'underscore',
    'text!./files/explorer_helpers.py',
    'css!./styles/DatasetExplorerWidget.css',
], function (
    Storage,
    Session,
    Plotly,
    PlotEditor,
    ArtifactLoader,
    _,
    HELPERS_PY,
) {
    'use strict';

    const WIDGET_CLASS = 'dataset-explorer';

    class DatasetExplorerWidget {
        constructor(logger, container) {
            this._logger = logger.fork('Widget');

            // TODO: Prompt for compute info
            this.session = new Session('local');

            this.$el = container;
            this.$el.addClass(WIDGET_CLASS);
            const row = $('<div>', {class: 'row', style: 'height: 100%'});
            this.$el.append(row);

            this.$plot = $('<div>', {class: 'plot col-9', style: 'height: 100%'});

            const rightPanel = $('<div>', {class: 'col-3'});
            const $plotEditor = $('<div>', {class: 'plot-editor'});
            this.plotEditor = new PlotEditor($plotEditor);
            this.plotEditor.on('update', plotData => {
                this.updatePlot(plotData);
            });
            const $artifactLoader = $('<div>', {class: 'artifact-loader'});
            this.artifactLoader = new ArtifactLoader($artifactLoader, this.session);

            row.append(this.$plot);
            rightPanel.append($plotEditor);
            //rightPanel.append($artifactLoader);
            row.append(rightPanel);

            // TODO: start loading message...
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
            await this.session.addFile('utils/explorer_helpers.py', HELPERS_PY);
            console.log('adding file...');

            // TODO: Ask if we should load the data?
            const dataInfo = JSON.parse(desc.data);
            const config = await this.getAuthenticationConfig(dataInfo);

            // TODO: Show loading message...
            const name = desc.name.replace(/[^a-zA-Z_]/g, '_');
            await this.session.addArtifact(name, dataInfo, desc.type, config);
        }

        async getYValues (lineInfo) {
            const {data, dataSlice=''} = lineInfo;
            const command = [
                `from artifacts.${data} import data`,
                'import json',
                `print(json.dumps([l for l in data${dataSlice}]))`
            ].join(';');
            const {stdout} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            return JSON.parse(stdout);
        }

        async getMetadata (desc) {
            const {name} = desc;
            const command = [
                `from artifacts.${name} import data`,
                'from utils.explorer_helpers import metadata',
                'import json',
                `print(json.dumps(metadata("${name}", data)))`
            ].join(';');
            const {stdout} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            return JSON.parse(stdout);
        }

        async getPlotData (line) {
            return {
                y: await this.getYValues(line),
                boxpoints: 'all',
                jitter: 0.3,
                pointpos: -1.8,
                name: line.name,
                type: 'box'
            };
        }

        onWidgetContainerResize (/*width, height*/) {
            this._logger.debug('Widget is resizing...');
        }

        defaultLayout(desc) {
            const title = `Distribution of Labels for ${desc.name}`;
            return {title};
        }

        async updatePlot (figureData) {
            const layout = _.pick(figureData, ['title', 'xaxis', 'yaxis']);
            const data = await Promise.all(
                figureData.data.map(data => this.getPlotData(data))
            );
            Plotly.newPlot(this.$plot[0], data, layout);
        }

        // Adding/Removing/Updating items
        async addNode (desc) {
            // TODO: update the loading messages
            //  - loading data?
            //  - prompt about the type of compute to use?
            // TODO: start loading messages

            await this.importDataToSession(desc);
            const layout = this.defaultLayout(desc);

            const data = _.extend({}, layout);
            data.plottedData = [];  // FIXME: remove this 
            data.metadata = [await this.getMetadata(desc)];
            this.plotEditor.set(data);

            Plotly.react(this.$plot[0]);  // FIXME
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
