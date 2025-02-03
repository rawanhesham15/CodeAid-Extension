import * as vscode from 'vscode';

export class MyTreeItem {
    label: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    command?: vscode.Command;
    selected: boolean; // Tracks if this item is selected
    contextValue: string; // Used to store additional information about the item (e.g., SOLID, Coupling)

    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, selected: boolean = false, contextValue: string = '', command?: vscode.Command) {
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.selected = selected;
        this.contextValue = contextValue;
        this.command = command;
    }
}
