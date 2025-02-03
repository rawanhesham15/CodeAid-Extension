"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTreeView = updateTreeView;
// This function will notify the tree view to update whenever there is a change in the data
function updateTreeView(emitter) {
    emitter.fire(undefined); // Notify that tree data has changed, causing a re-render
}
//# sourceMappingURL=utils.js.map