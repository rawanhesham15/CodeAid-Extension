import * as vscode from "vscode";
import { MyTreeItem } from "../models/actionItem";
import { updateTreeView } from "./utils";

export class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private rootItems: MyTreeItem[];
    private selectedRootItem: MyTreeItem | null = null;
    private _onDidChangeTreeData = new vscode.EventEmitter<MyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;


    constructor() {
        // Initialize root items once so they can be accessed synchronously
        this.rootItems = [
            new MyTreeItem('Detection ', vscode.TreeItemCollapsibleState.Collapsed, false, 'detection'),
            new MyTreeItem('Plot Diagram ', vscode.TreeItemCollapsibleState.Collapsed, false, 'plotDiagram'),
            new MyTreeItem('Display Rate ', vscode.TreeItemCollapsibleState.Collapsed, false, 'displayRate'),
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
      }
   // Provide tree items
    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    // Get children of the given element
    getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (!element) {
            // Root items (can be accessed synchronously from `this.rootItems`)
            return Promise.resolve(this.rootItems);
        }

        const subItems: Record<string, MyTreeItem[]> = {
            detection: [
                new MyTreeItem('SOLID', vscode.TreeItemCollapsibleState.Collapsed,false, 'solid'),
                new MyTreeItem('Coupling', vscode.TreeItemCollapsibleState.Collapsed,false, 'coupling'),
            ],
            solid: [
                new MyTreeItem('Current File', vscode.TreeItemCollapsibleState.Collapsed, false, 'currentFile'),
                new MyTreeItem('Whole Project', vscode.TreeItemCollapsibleState.Collapsed, false, 'wholeProject'),
            ],
            coupling: [
                new MyTreeItem('Current File', vscode.TreeItemCollapsibleState.Collapsed, false, 'currentFile'),
                new MyTreeItem('Whole Project', vscode.TreeItemCollapsibleState.Collapsed, false, 'wholeProject'),
            ],
            plotDiagram: [
                new MyTreeItem('Dependency diagram', vscode.TreeItemCollapsibleState.Collapsed,false, "dDiagram"),
                new MyTreeItem('Class Diagram', vscode.TreeItemCollapsibleState.Collapsed, false, 'cDiagram'),
                new MyTreeItem('Architecture Diagram', vscode.TreeItemCollapsibleState.Collapsed, false, 'aDiagram'),
            ],

            displayRate: [
                new MyTreeItem('Complexity Rate', vscode.TreeItemCollapsibleState.Collapsed, false, 'complexityRate'),
            ],

            currentFile: [
                this.createButton('Start Detection', 'extension.analyzeFile') as MyTreeItem,
            ],
            wholeProject: [
                this.createButton('Start Detection', 'extension.analyzeProject') as MyTreeItem,
            ],

            dDiagram: [
                this.createButton('Generate Diagram', 'extension.generateDependencyDiagram') as MyTreeItem,
            ],
            cDiagram: [
                this.createButton('Generate Diagram', 'extension.generateClassDiagram') as MyTreeItem,
            ],
            aDiagram: [
                this.createButton('Generate Diagram', 'extension.generateArchitectureDiagram') as MyTreeItem,
            ],
            complexityRate: [ 
                this.createButton('Display Rate', 'extension.displayRate') as MyTreeItem,
            ],
        };

        return Promise.resolve(subItems[element.contextValue] || []);
    }

    // Select a root item (ensuring only one is selected)
    selectRootItem(item: MyTreeItem) {
        this.selectedRootItem = item; // Store selected root item
        this.rootItems.forEach(root => root.selected = root === item); // Ensure only one is selected
        this._onDidChangeTreeData.fire(); // Refresh UI
    }

    // Get root items synchronously
    getRootItems(): MyTreeItem[] {
        return this.rootItems;
    }

    private createButton(label: string, command: string): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(label);
        treeItem.command = {
            command: command,
            title: label,
        };
        treeItem.tooltip = `Click to execute ${label}`;
        treeItem.iconPath = new vscode.ThemeIcon("debug-start"); // Use a built-in icon
        return treeItem;
    }
}

