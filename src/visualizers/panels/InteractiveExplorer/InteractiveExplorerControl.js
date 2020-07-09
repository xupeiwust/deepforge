/*globals define */

define([
    'panels/InteractiveEditor/InteractiveEditorControl',
], function (
    InteractiveEditorControl,
) {

    'use strict';

    class InteractiveExplorerControl extends InteractiveEditorControl {
        save() {
            // TODO
            const snapshotDesc = this._widget.getSnapshot();
            // TODO: Check the type of the snapshot (add a validate method)
            const isMetadata = this.isMetadata(snapshotDesc.type);

            this.client.startTransaction();
            const data = this.createNode(snapshotDesc);
            //const implicitOp = this.createNode(this._widget.getEditorState(), data);
            //this.client.setPointer(data.getId(), 'provenance', implicitOp.getId());
            //const operation = this.createNode(this._widget.getOperation(), implicitOp);
            //this.client.setPointer(implicitOp.getId(), 'operation', operation.getId());
            this.client.completeTransaction();
        }

    }

    return InteractiveExplorerControl;
});
