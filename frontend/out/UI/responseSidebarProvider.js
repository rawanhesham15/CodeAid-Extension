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
const vscode = __importStar(require("vscode"));
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
        if (this.responses.length === 0) {
            return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          <p style='text-align: center; color: #919191'>No responses yet, start action to get responses</p>
        </body>
        </html>`;
        }
        const undoEligibleTypes = ["Refactor Result"];
        const refactorEligibleTypes = ["Coupling Smells Detection", "Solid Detection for File"];
        // const lastEligibleResponse = this.responses.find((res) =>
        //   refactorEligibleTypes.includes(res.responseType)
        // );
        const lastEligibleMap = {};
        [...this.responses].forEach((res) => {
            if (refactorEligibleTypes.includes(res.responseType) &&
                !(res.responseType in lastEligibleMap)) {
                lastEligibleMap[res.responseType] = res.id;
            }
        });
        const responseContent = this.responses
            .map((res) => {
            const showRefactor = refactorEligibleTypes.includes(res.responseType) &&
                lastEligibleMap[res.responseType] === res.id;
            const showUndo = undoEligibleTypes.includes(res.responseType);
            return `
        <div id="response-${res.id}" style="
          background-color: rgb(30, 30, 30);
          color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
          margin: 10px 0;
          font-size: 14px;
          align-items: center;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p style="font-size: 17px; font-weight: 500;color: #007f89">${res.responseType}</p>
              <div>
                <i onclick="deleteResponse(${res.id})" style="cursor: pointer;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0,0,256,256">
                    <g fill="#9C9B9B"><g transform="scale(5.12,5.12)">
                      <path d="M7.71875,6.28125l-1.4375,1.4375l17.28125,17.28125l-17.28125,17.28125l1.4375,1.4375l17.28125,-17.28125l17.28125,17.28125l1.4375,-1.4375l-17.28125,-17.28125l17.28125,-17.28125l-1.4375,-1.4375l-17.28125,17.28125z"></path>
                    </g></g>
                  </svg>
                </i>
              </div>    
            </div>
          <div style="margin-top:0px; padding-top:0px">
            <p>${res.content}</p>
            <small style="color: gray;">${res.timestamp}</small>
            ${showRefactor
                ? `<button class="refactor-btn" onclick="refactorResponse()" style="
                    margin-top: 10px;
                    padding: 5px 10px;
                    background-color: ${res.refactorDisabled ? '#6c757d' : '#007f89'};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: ${res.refactorDisabled ? 'not-allowed' : 'pointer'};"
                    ${res.refactorDisabled ? 'disabled' : ''}>${res.refactorDisabled ? 'Refactored' : 'Refactor'}</button>`
                : ""}
            ${showUndo
                ? `<button class="undo-btn" onclick="undoResponse()" style="
                    margin-top: 10px;
                    margin-left: 10px;
                    padding: 5px 10px;
                    background-color: ${res.undoDisabled ? '#6c757d' : '#007f89'};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: ${res.undoDisabled ? 'not-allowed' : 'pointer'};"
                    ${res.undoDisabled ? 'disabled' : ''}>${res.undoDisabled ? 'Undone' : 'Undo'}</button>`
                : ""}
          </div>   
        </div>`;
        })
            .join("");
        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

          function refactorResponse() {
            vscode.postMessage({ command: 'refactorResponse' });
          }

          function undoResponse() {
            vscode.postMessage({ command: 'undoResponse' });
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
        // 🟢 Listen to messages from the webview
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === "deleteResponse") {
                this.deleteResponse(message.id);
            }
            else if (message.command === "refactorResponse") {
                const lastRefactorable = this.responses.find((r) => r.responseType === "Solid Detection for File" ||
                    r.responseType === "Coupling Smells Detection");
                if (lastRefactorable) {
                    lastRefactorable.refactorDisabled = true;
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage("No active editor found.");
                        return;
                    }
                    const path = editor.document.uri.fsPath;
                    const content = editor.document.getText();
                    if (lastRefactorable.responseType === "Solid Detection for File") {
                        vscode.commands.executeCommand("extension.refactorCode", path, content);
                    }
                    else if (lastRefactorable.responseType === "Coupling Smells Detection") {
                        vscode.commands.executeCommand("extension.refactorCouplingSmells");
                    }
                    if (this._view) {
                        this._view.webview.html = this.buildContent();
                    }
                }
            }
            else if (message.command === "undoResponse") {
                const lastUndoable = this.responses.find((r) => r.responseType === "Refactor Result");
                if (lastUndoable) {
                    lastUndoable.undoDisabled = true;
                }
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage("No active editor found.");
                    return;
                }
                const path = editor.document.uri.fsPath;
                vscode.commands.executeCommand("extension.undo", path);
                if (this._view) {
                    this._view.webview.html = this.buildContent();
                }
            }
        });
        // 🟢 Listen for text changes and disable refactor
        vscode.workspace.onDidChangeTextDocument((event) => {
            const lastRefactorable = this.responses.find((r) => (r.responseType === "Solid Detection for File" ||
                r.responseType === "Coupling Smells Detection") &&
                !r.refactorDisabled);
            if (lastRefactorable) {
                lastRefactorable.refactorDisabled = true;
                if (this._view) {
                    this._view.webview.html = this.buildContent();
                }
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