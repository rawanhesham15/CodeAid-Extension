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
                align-items: center;">
                  <div style="display: flex; justify-content: space-between; align-items: center;margin-bottom:0px; padding-bottom:0px">
                    <p style="font-size: 17px; font-weight: 500;color: #007f89">${res.responseType}</p>
                    <div>
                      <i onclick="deleteResponse(${res.id})" style="
                      cursor: pointer;
                      display: inline-block;
                  ">
                      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,0,256,256">
                        <g fill="#9C9B9B" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(5.12,5.12)"><path d="M7.71875,6.28125l-1.4375,1.4375l17.28125,17.28125l-17.28125,17.28125l1.4375,1.4375l17.28125,-17.28125l17.28125,17.28125l1.4375,-1.4375l-17.28125,-17.28125l17.28125,-17.28125l-1.4375,-1.4375l-17.28125,17.28125z"></path></g></g>
                      </svg>
                      </i>
                    </div>    
                  </div>
                <div style="margin-top:0px; padding-top:0px">
                  <p>${res.content}</p>
                  <small style="color: gray;">${res.timestamp}</small>
                </div>   
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
    updateContent(newContent, responseType) {
        const timestamp = new Date().toLocaleTimeString();
        this.responses.unshift({
            id: this.responseCounter++,
            content: newContent,
            timestamp: timestamp,
            responseType: responseType,
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