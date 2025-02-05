import * as vscode from "vscode";
import { MyTreeItem } from "../models/actionItem";
import { updateTreeView } from "./utils";

export class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
  private context: vscode.ExtensionContext;
  private rootItems: MyTreeItem[];
  private selectedRootItem: MyTreeItem | null = null;
  private _onDidChangeTreeData = new vscode.EventEmitter<
    MyTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    MyTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.rootItems = [
      new MyTreeItem(
        "🛠️ Detection Solid",
        vscode.TreeItemCollapsibleState.Collapsed,
        false,
        "detection_solid"
      ),
      new MyTreeItem(
        "🛠️ Detection Coupling",
        vscode.TreeItemCollapsibleState.Collapsed,
        false,
        "detection_coupling"
      ),
      new MyTreeItem(
        "📊 Plot Diagram ",
        vscode.TreeItemCollapsibleState.Collapsed,
        false,
        "plotDiagram"
      ),
      new MyTreeItem(
        "📈 Complexity Rate ",
        vscode.TreeItemCollapsibleState.Collapsed,
        false,
        "complexityRate"
      ),
    ];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element: MyTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.rootItems);
    }

    const subItems: Record<string, MyTreeItem[]> = {
      detection_solid: [
        this.createButton(
          "📄 Current File",
          "extension.analyzeFile"
        ) as MyTreeItem,
        this.createButton(
          "🗂️ Whole Project",
          "extension.analyzeProject"
        ) as MyTreeItem,
      ],
      detection_coupling: [
        this.createButton(
          "📄 Current File",
          "extension.analyzeFile"
        ) as MyTreeItem,
        this.createButton(
          "🗂️ Whole Project",
          "extension.analyzeProject"
        ) as MyTreeItem,
      ],
      plotDiagram: [
        this.createButton(
          "🏷️ Dependency diagram",
          "extension.plotDependencyDiagram",
        ) as MyTreeItem,
        this.createButton(
          "Class Diagram",
          "extension.plotClassDiagram",
          "classDiagram"
        ) as MyTreeItem,
        this.createButton(
          "Architecture Diagram",
          "extension.plotArchitectureDiagram"
        ) as MyTreeItem,
      ],
      complexityRate: [
        this.createButton(
          "▶️ Display Rate",
          "extension.displayRate"
        ) as MyTreeItem,
      ],
    };

    return Promise.resolve(subItems[element.contextValue] || []);
  }

  selectRootItem(item: MyTreeItem) {
    this.selectedRootItem = item;
    this.rootItems.forEach((root) => (root.selected = root === item)); 
    this._onDidChangeTreeData.fire();
  }

  getRootItems(): MyTreeItem[] {
    return this.rootItems;
  }

  private createButton(label: string, command: string, iconPath?: string): vscode.TreeItem {
  const treeItem = new vscode.TreeItem(label);
  treeItem.command = {
    command: command,
    title: label,
  };

  treeItem.tooltip = `Click to execute ${label}`;

  if (iconPath) {
    const absolutePath = this.context.asAbsolutePath(`media/${iconPath}.jpg`); 
    treeItem.iconPath = {
      dark: vscode.Uri.file(absolutePath),
      light: vscode.Uri.file(absolutePath),
    };
  }

  return treeItem;
}

  
}
