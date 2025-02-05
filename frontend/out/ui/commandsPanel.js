"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const actionItem_1 = require("../models/actionItem");
class MyTreeDataProvider {
    context;
    rootItems;
    selectedRootItem = null;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(context) {
        this.context = context;
        this.rootItems = [
            new actionItem_1.MyTreeItem("🛠️ Detection Solid", vscode.TreeItemCollapsibleState.Collapsed, false, "detection_solid"),
            new actionItem_1.MyTreeItem("🛠️ Detection Coupling", vscode.TreeItemCollapsibleState.Collapsed, false, "detection_coupling"),
            new actionItem_1.MyTreeItem("📊 Plot Diagram ", vscode.TreeItemCollapsibleState.Collapsed, false, "plotDiagram"),
            new actionItem_1.MyTreeItem("📈 Complexity Rate ", vscode.TreeItemCollapsibleState.Collapsed, false, "complexityRate"),
        ];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.rootItems);
        }
        const subItems = {
            detection_solid: [
                this.createButton("📄 Current File", "extension.analyzeFile"),
                this.createButton("🗂️ Whole Project", "extension.analyzeProject"),
            ],
            detection_coupling: [
                this.createButton("📄 Current File", "extension.analyzeFile"),
                this.createButton("🗂️ Whole Project", "extension.analyzeProject"),
            ],
            plotDiagram: [
                this.createButton("🏷️ Dependency diagram", "extension.plotDependencyDiagram"),
                this.createButton("Class Diagram", "extension.plotClassDiagram", "classDiagram"),
                this.createButton("Architecture Diagram", "extension.plotArchitectureDiagram"),
            ],
            complexityRate: [
                this.createButton("▶️ Display Rate", "extension.displayRate"),
            ],
        };
        return Promise.resolve(subItems[element.contextValue] || []);
    }
    selectRootItem(item) {
        this.selectedRootItem = item;
        this.rootItems.forEach((root) => (root.selected = root === item));
        this._onDidChangeTreeData.fire();
    }
    getRootItems() {
        return this.rootItems;
    }
    createButton(label, command, iconPath) {
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
exports.MyTreeDataProvider = MyTreeDataProvider;
//# sourceMappingURL=commandsPanel.js.map