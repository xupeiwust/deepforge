/*globals define, $ */

define([
    'deepforge/storage/index',
    'deepforge/compute/interactive/session-with-queue',
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
            this.initSession();

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
            this.metadata = [];
            const $artifactLoader = $('<div>', {class: 'artifact-loader'});
            this.artifactLoader = new ArtifactLoader($artifactLoader, this.session);
            this.artifactLoader.getConfigDialog = () => this.getConfigDialog();  // HACK
            this.artifactLoader.on('load', async desc => {
                this.metadata.push(await this.getMetadata(desc));
                this.plotEditor.set({metadata: this.metadata});
            });

            row.append(this.$plot);
            rightPanel.append($plotEditor);
            rightPanel.append($artifactLoader);
            row.append(rightPanel);

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

        async initSession (desc) {
            await this.session.whenConnected();
            await this.session.addFile('utils/explorer_helpers.py', HELPERS_PY);
        }

        async importDataToSession (desc) {
            console.log('adding file...');

            const dataInfo = JSON.parse(desc.data);
            const config = await this.getAuthenticationConfig(dataInfo);

            const name = desc.name.replace(/[^a-zA-Z_]/g, '_');
            await this.session.addArtifact(name, dataInfo, desc.type, config);
        }

        async getPoints (lineInfo) {
            const {data, dataSlice=''} = lineInfo;
            const [artifactName] = data.split('[');
            const command = [
                `from artifacts.${artifactName} import data as ${artifactName}`,
                `from utils.explorer_helpers import tolist`,
                'import json',
                `print(json.dumps(tolist(${data}${dataSlice})))`
            ].join(';');
            const {stdout} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            return JSON.parse(stdout);
        }

        async getColorValues (lineInfo) {
            const {colorData, colorDataSlice='', startColor, endColor} = lineInfo;
            const [artifactName] = colorData.split('[');
            const command = [
                `from artifacts.${artifactName} import data as ${artifactName}`,
                `from utils.explorer_helpers import tolist, scale_colors`,
                'import json',
                `data = ${colorData}${colorDataSlice}`,
                `colors = scale_colors(data, "${startColor}", "${endColor}")`,
                `print(json.dumps(colors))`
            ].join(';');
            const {stdout, stderr} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            if (stderr) console.log('stderr:', stderr);
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
            const {stdout, stderr} = await this.session.exec(`python -c '${command}'`);  // TODO: Add error handling
            if (stderr) console.log('stderr:', stderr);
            return JSON.parse(stdout);
        }

        async getPlotData (line) {
            const {shape} = line;
            const dim = shape[1];
            const dataDims = dim ? dim : 1;
            let x,y,z;
            let plotData = null;
            switch(dataDims) {
            case 1:
                plotData = {
                    y: await this.getPoints(line),
                    boxpoints: 'all',
                    jitter: 0.3,
                    pointpos: -1.8,
                    name: line.name,
                    type: 'box'
                };
                break;

            case 2:
                [x, y] = _.unzip(await this.getPoints(line));
                plotData = {
                    name: line.name,
                    mode: 'markers',  // lines
                    type: 'scatter',
                    x, y
                };
                break;

            case 3:
                [x, y, z] = _.unzip(await this.getPoints(line));
                plotData = {
                    name: line.name,
                    mode: 'markers',  // lines
                    type: 'scatter3d',
                    x, y, z
                };
                break;
            }
            await this.addPlotColor(plotData, line);
            return plotData;
        }

        async addPlotColor (plotData, line) {
            if (line.colorType === 'uniform') {
                plotData.marker = {
                    color: `#${line.uniformColor}`,
                    size: 2,
                };
            } else {
                const colors = await this.getColorValues(line);
                plotData.marker = {
                    color: colors,
                    size: 2
                };
            }
            return plotData;
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
            if (layout.xaxis) {
                layout.xaxis = {title: layout.xaxis};
            }
            if (layout.yaxis) {
                layout.yaxis = {title: layout.yaxis};
            }
            const data = [];
            for (let i = 0; i < figureData.data.length; i++) {
                data.push(await this.getPlotData(figureData.data[i]));
            }
            Plotly.newPlot(this.$plot[0], data, layout);
        }

        // Adding/Removing/Updating items
        async addNode (desc) {
            this.artifactLoader.register(desc);
            // TODO: update the loading messages
            //  - loading data?
            //  - prompt about the type of compute to use?
            // TODO: start loading messages

            //await this.importDataToSession(desc);
            //const layout = this.defaultLayout(desc);

            //const data = _.extend({}, layout);
            //data.plottedData = [];  // FIXME: remove this 
            //data.metadata = [await this.getMetadata(desc)];
            //this.plotEditor.set(data);

            Plotly.react(this.$plot[0]);  // FIXME
        }

        removeNode (gmeId) {
            this.artifactLoader.unregister(gmeId);
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
