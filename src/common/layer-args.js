define([
    'text!deepforge/layers.yml',
    'deepforge/js-yaml.min'
], function(
    LAYER_TEXT,
    yaml
) {
    'use strict';

    // default arg
    var cleanArg = function(arg) {
        var name = Object.keys(arg)[0],
            result = arg[name] || {type: 'integer'};

        result.name = name;
        return result;
    };

    // Create the layer dictionary
    var LayerDict = {},
        layerObj = yaml.load(LAYER_TEXT),
        absLayers = Object.keys(layerObj),
        layer,
        layers;

    // Basically, create a dictionary of the second level of keys
    for (var i = absLayers.length; i--;) {
        layers = layerObj[absLayers[i]];
        for (var j = layers.length; j--;) {
            layer = layers[j];
            if (typeof layer === 'string') {
                LayerDict[layers[j]] = [];
            } else {
                layer = Object.keys(layer)[0];
                LayerDict[layer] = (layers[j][layer] || [])
                    .map(cleanArg);
            }
        }
    }

    return LayerDict;
});
