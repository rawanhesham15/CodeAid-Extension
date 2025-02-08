"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResponseSidebarProvider {
    _extensionUri;
    static viewType = "ResponseView";
    _view;
    responses = [];
    responseCounter = 0;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    buildContent() {
        const responseContent = this.responses.length === 0
            ? "<p style='text-align: center; color: #919191'>No responses yet, start action to get responses</p>"
            : this.responses
                .map((res) => `
              <div id="response-${res.id}" style="
                background-color: rgb(30, 30, 30);
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
                margin: 10px 0;
                font-size: 14px;
                line-height: 1.5;
                display: flex;
                justify-content: space-between;
                align-items: center;">
                <div>
                  <p>${res.content}</p>
                  <small style="color: gray;">${res.timestamp}</small>
                </div>
                <i onclick="deleteResponse(${res.id})" style="
                    cursor: pointer;
                    width: 20px;
                    height: 20px;
                    display: inline-block;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                </i>
              </div>
            `)
                .join("");
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Outfit', sans-serif;
                        background-color: rgb(18, 18, 18);
                        color: white;
                        padding: 20px;
                    }
                </style>    
            </head>
            <body>
                <h2 style="text-align: center;">CodeAid Responses Panel</h2>
                ${responseContent}
                <script>
                  const vscode = acquireVsCodeApi();

                  function deleteResponse(id) {
                    vscode.postMessage({ command: 'deleteResponse', id: id });
                  }
                </script>
            </body>
            </html>`;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.html = this.buildContent();
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === "deleteResponse") {
                this.deleteResponse(message.id);
            }
        });
    }
    updateContent(newContent) {
        const timestamp = new Date().toLocaleTimeString();
        this.responses.unshift({
            id: this.responseCounter++,
            content: newContent,
            timestamp: timestamp,
        });
        if (this._view) {
            this._view.webview.html = this.buildContent();
        }
    }
    deleteResponse(id) {
        this.responses = this.responses.filter((res) => res.id !== id);
        if (this._view) {
            this._view.webview.html = this.buildContent();
        }
    }
}
exports.default = ResponseSidebarProvider;
//# sourceMappingURL=responseSidebarProvider.js.map