"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResponseSidebar {
    _extensionUri;
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.html = this.getHtmlForWebview();
    }
    getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>WebView</title>
            </head>
            <body>
                <h2>Hello from WebView</h2>
                <p>This is a WebView inside the Secondary Sidebar.</p>
            </body>
            </html>
        `;
    }
}
exports.default = ResponseSidebar;
//# sourceMappingURL=responsePanelProvider.js.map