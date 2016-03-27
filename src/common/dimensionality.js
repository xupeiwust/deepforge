define([
], function(
) {
    'use strict';

    var dimensionality = function(type, attr, prev) {
        if (!dimensionality[type]) {
            // This will be tricky with custom layers...
            // TODO
            throw 'Cannot determine dimensionality of ' + type;
        }
        return dimensionality[type](type, attr, prev);
    };

    // Currently, this is done by the meta type of the given layer.
    // It would probably be more extensible to have "types of types" or,
    // rather, an enumeration of dimensionality calculation techniques
    // that the layer's meta type registers to FIXME
    dimensionality.Reshape = function(type, attr, prev) {
        return attr.dimensions || 1;
    };

    dimensionality.Linear = function(type, attr, prev) {
        return attr.output || 1;
    };

    dimensionality.View = function(type, attr, prev) {
        // If there are no -1's then return the attributes
        // TODO
        // Else, use the previous dimensions to get the amount of data
        // then infer the omitted dimension
        // TODO
        return attr.output || 1;
    };

    var PassThru = function(type, attr, prev) {
        if (!prev) {
            throw 'Cannot determine prev args of ' + type;
        }
        return dimensionality.apply(null, prev());
    };

    [  // pass through layers -> same dim as predecessor
        'HardTanh',
        'HardShrink',
        'SoftShrink',
        'SoftMax',
        'SoftMin',
        'SoftPlus',
        'SoftSign',
        'LogSigmoid',
        'LogSoftMax',
        'Sigmoid',
        'Tanh',
        'ReLU',
        'PReLU',
        'RReLU',
        'LeakyReLU',
        'AddConstant',
        'MulConstant',

        'BatchNormalization',
        'SpatialBatchNormalization',

        // Math
        'Mul',  // Does this really leave the size the same?
        'CMul',
        'Add'
    ].forEach(layer => dimensionality[layer] = PassThru);

    return dimensionality;
});
