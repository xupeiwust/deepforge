define([
    'TemplateCreator/templates/Constants',
    'deepforge/lua'
], function(
    Constants,
    luajs
) {
    'use strict';

    var dimensionality = function(node) {
        var transform = node.dimensionalityTransform;
        return dimensionality[transform](node);
    };

    // If 'same', return the input dimensions
    dimensionality.same = function(node) {
        var prev = node[Constants.PREV][0];
        return dimensionality(prev);
    };

    dimensionality.custom = function(node) {
        var luaFn = node.calculateDimensionality,
            cxt = luajs.newContext(),
            layer,  // lua layer
            bin,
            dims;

        cxt.loadStdLib();
        //   - cross compile to js
        bin = cxt.loadString(luaFn);
        bin();  // load the calc fn to global context

        // Create the layer
        layer = new luajs.types.LuaTable();
        var attrs = Object.keys(node).filter(attr => attr.indexOf('_') !== 0);
        for (var i = attrs.length; i--;) {
            layer.set(attrs[i], node[attrs[i]]);
        }
        cxt._G.set('layer', layer);

        // call the function with layer and input dimensions
        bin = cxt.loadString('return calcDims(layer)');
        dims = bin()[0];  // TODO: Add support for multiple dimensions

        // TODO: return a fn if it depends on the previous value

        return dims;
    };

    return dimensionality;
});
