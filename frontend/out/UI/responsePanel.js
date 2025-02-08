"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsePanel = void 0;
class ResponsePanel {
    static panel;
    static setPanel(view) {
        this.panel = view;
    }
    static updateContent(content) {
        if (this.panel) {
            this.panel.webview.html = `<p>${content}</p>`;
        }
    }
}
exports.ResponsePanel = ResponsePanel;
exports.default = { ResponsePanel };
//# sourceMappingURL=responsePanel.js.map