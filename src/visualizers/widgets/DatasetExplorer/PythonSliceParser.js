/* globals define */
define([
], function(
) {

    class OutOfRangeError extends Error {
        constructor(len, index) {
            super(`Index out of range: ${index} (length is ${len})`);
        }
    }

    class ArrayAccessor {
        select(/*dims*/) {
            const typeName = this.constructor.name;
            throw new Error(`"select" not implemented for ${typeName}`);
        }
    }

    class Index extends ArrayAccessor {
        constructor(index) {
            super();
            this.index = index;
        }

        select(dims) {
            this.ensureValidIndex(dims);
            return dims.slice(1);
        }

        isInRange(len) {
            return this.index < len;
        }

        ensureValidIndex(dims) {
            if (!this.isInRange(dims[0])) {
                throw new OutOfRangeError(dims[0], this.index);
            }
        }
    }

    class Slice extends ArrayAccessor {
        constructor(start, stop, step) {
            super();
            this.start = start || 0;
            this.stop = stop || Infinity;
            this.step = step || 1;
        }

        resolveIndex(len, index) {
            if (index < 0) {
                return len + index;
            }
            if (index > len) {
                return len;
            }
            return index;
        }

        select(dims, position) {
            const [dim, ...nextDims] = dims.slice(position);
            const start = this.resolveIndex(dim, this.start);
            const end = this.resolveIndex(dim, this.stop);
            const newDim = Math.ceil((end - start)/this.step);
            const newDims = newDim > 0 ? [newDim, ...nextDims] : [];

            return dims.slice(0, position).concat(newDims);
        }

        static from(string) {
            let [start, stop, step] = string.split(':')
                .map(num => num && +num);

            const isSingleIndex = stop === undefined;
            if (isSingleIndex) {
                return new Index(start);
            }

            return new Slice(start, stop, step);
        }
    }

    function getSliceStrings(rawString) {
        return rawString
            .replace(/(^\[|\]$)/g, '')
            .split('][')
            .flatMap(chunk => chunk.split(','));
    }

    function getSlicedShape(startShape, sliceString) {
        const slices = getSliceStrings(sliceString).map(Slice.from);
        return slices.reduce(
            (shape, slice, position) => slice.select(shape, position),
            startShape
        );
    }

    return getSlicedShape;
});
