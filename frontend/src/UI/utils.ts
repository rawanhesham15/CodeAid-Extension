import * as vscode from 'vscode';

// This function will notify the tree view to update whenever there is a change in the data
export function updateTreeView(emitter: vscode.EventEmitter<any>) {
    emitter.fire(undefined);  // Notify that tree data has changed, causing a re-render
}
