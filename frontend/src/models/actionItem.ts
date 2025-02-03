import * as vscode from 'vscode';

export class MyTreeItem {
    label: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    command?: vscode.Command;
    selected: boolean;
    contextValue: string;

    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, selected: boolean = false, contextValue: string = '', command?: vscode.Command) {
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.selected = selected;
        this.contextValue = contextValue;
        this.command = command;
    }
}
