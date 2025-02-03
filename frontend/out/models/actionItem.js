"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTreeItem = void 0;
class MyTreeItem {
    label;
    collapsibleState;
    command;
    selected;
    contextValue;
    constructor(label, collapsibleState, selected = false, contextValue = '', command) {
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.selected = selected;
        this.contextValue = contextValue;
        this.command = command;
    }
}
exports.MyTreeItem = MyTreeItem;
//# sourceMappingURL=actionItem.js.map