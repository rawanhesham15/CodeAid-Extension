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
    rootItems;
    selectedRootItem = null;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor() {
        // Initialize root items once so they can be accessed synchronously
        this.rootItems = [
            new actionItem_1.MyTreeItem('Detection: ', vscode.TreeItemCollapsibleState.Collapsed, false),
            new actionItem_1.MyTreeItem('Refactor Code: ', vscode.TreeItemCollapsibleState.Collapsed, false),
            new actionItem_1.MyTreeItem('Plot Diagram: ', vscode.TreeItemCollapsibleState.Collapsed, false),
            new actionItem_1.MyTreeItem('Display Rate: ', vscode.TreeItemCollapsibleState.Collapsed, false)
        ];
    }
    // Get the root items of the tree
    // Provide tree items
    getTreeItem(element) {
        return element;
    }
    // Get children of the given element
    getChildren(element) {
        if (!element) {
            // Root items (can be accessed synchronously from `this.rootItems`)
            return Promise.resolve(this.rootItems);
        }
        if (element.label === 'Detection') {
            return Promise.resolve([
                new actionItem_1.MyTreeItem('SOLID', vscode.TreeItemCollapsibleState.None, false, 'solid'),
                new actionItem_1.MyTreeItem('Coupling', vscode.TreeItemCollapsibleState.None, false, 'coupling')
            ]);
        }
        if (element.contextValue === 'solid' || element.contextValue === 'coupling') {
            return Promise.resolve([
                new actionItem_1.MyTreeItem('Current File', vscode.TreeItemCollapsibleState.None, false, 'currentFile'),
                new actionItem_1.MyTreeItem('Whole Project', vscode.TreeItemCollapsibleState.None, false, 'wholeProject')
            ]);
        }
        if (element.contextValue === 'currentFile' || element.contextValue === 'wholeProject') {
            return Promise.resolve([
                new actionItem_1.MyTreeItem('Start', vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    }
    // Select a root item (ensuring only one is selected)
    selectRootItem(item) {
        this.selectedRootItem = item; // Store selected root item
        this.rootItems.forEach(root => root.selected = root === item); // Ensure only one is selected
        this._onDidChangeTreeData.fire(); // Refresh UI
    }
    // Get root items synchronously
    getRootItems() {
        return this.rootItems;
    }
}
exports.MyTreeDataProvider = MyTreeDataProvider;
//# sourceMappingURL=commandsPanel.js.map