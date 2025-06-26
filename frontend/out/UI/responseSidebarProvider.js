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
    isLoading = false;
    loadingMessage = "";
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    updateWebview() {
        if (this._view) {
            this._view.webview.html = this.buildContent();
        }
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
        const buttonLabel = {
            show: "Show Refactored Code",
            apply: "Apply Refactoring",
            undo: "Undo Refactoring",
        };
        const lastEligibleMap = {};
        for (const res of this.responses) {
            if (res.responseType === "Solid Detection for File" &&
                !(res.responseType in lastEligibleMap)) {
                lastEligibleMap[res.responseType] = res.id;
            }
            if (res.responseType === "Coupling Smells Detection for File" &&
                !(res.responseType in lastEligibleMap)) {
                lastEligibleMap[res.responseType] = res.id;
            }
        }
        const responseContent = this.responses
            .map((res) => {
            const showRefactor = res.responseType === "Solid Detection for File" &&
                lastEligibleMap[res.responseType] === res.id;
            let buttonHtml = "";
            if (res.responseType === "Solid Detection for File" &&
                showRefactor &&
                res.refactorState) {
                buttonHtml = `<button onclick="handleRefactor('${res.id}')"
                style="cursor: ${res.buttonDisabled || this.isLoading
                    ? "not-allowed"
                    : "pointer"};"
                ${res.buttonDisabled || this.isLoading ? "disabled" : ""}>
                ${buttonLabel[res.refactorState]}
              </button>`;
            }
            else if (res.responseType === "Coupling Smells Detection for File" &&
                !res.suggestionsVisible &&
                lastEligibleMap[res.responseType] === res.id) {
                buttonHtml = `<button onclick="handleSuggestion('${res.id}')"
                style="cursor: pointer;">
                Show Suggested Refactorings
              </button>`;
            }
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
              <p style="font-size: 17px; font-weight: 500;color: #178cad">${res.responseType}</p>
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
            <div style="display: flex;justify-content: space-between;">
              <small style="color: gray;">${res.timestamp}</small>
              ${buttonHtml}
            </div>
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
          button {
            font-family: "Outfit", serif;
            background-color: #178cad;
            color: white;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            margin-top: 5px;
            transition: 0.5s;
          }
          button:hover:enabled {
            background-color: transparent;
            border: 1px solid #178cad;
            color: #178cad;
            transition: 0.5s;
          }
        </style>
      </head>
      <body>
        <h2 style="text-align: center;">CodeAid Responses Panel</h2>
        ${responseContent}

        ${this.isLoading
            ? `
          <div id="loading-overlay" style="
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
            font-weight: bold;">
            ${this.loadingMessage}
          </div>`
            : ""}

        <script>
          const vscode = acquireVsCodeApi();

          function deleteResponse(id) {
            vscode.postMessage({ command: 'deleteResponse', id: id });
          }

          function handleRefactor(id) {
            vscode.postMessage({ command: 'handleRefactor', id: parseInt(id) });
          }

          function handleSuggestion(id) {
            vscode.postMessage({ command: 'handleSuggestion', id: parseInt(id) });
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
        this.updateWebview();
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === "deleteResponse") {
                this.deleteResponse(message.id);
            }
            else if (message.command === "handleRefactor") {
                const res = this.responses.find((r) => r.id === message.id);
                if (!res)
                    return;
                this.isLoading = true;
                if (res.refactorState === "show") {
                    this.loadingMessage = "Preparing refactored files...";
                    this.updateWebview();
                    vscode.commands
                        .executeCommand("extension.handleRefactorRequest")
                        .then(() => {
                        res.refactorState = "apply";
                        this.responses.forEach((r) => {
                            if (r.responseType === res.responseType) {
                                r.buttonDisabled = r.id !== res.id;
                            }
                        });
                        this.isLoading = false;
                        this.updateWebview();
                    });
                }
                else if (res.refactorState === "apply") {
                    this.loadingMessage = "Applying refactoring...";
                    this.updateWebview();
                    vscode.commands
                        .executeCommand("extension.applyRefactoring")
                        .then(() => {
                        res.refactorState = "undo";
                        this.isLoading = false;
                        this.updateWebview();
                    });
                }
                else if (res.refactorState === "undo") {
                    this.loadingMessage = "Undoing changes...";
                    this.updateWebview();
                    vscode.commands.executeCommand("extension.undo").then(() => {
                        res.refactorState = undefined;
                        this.isLoading = false;
                        this.updateWebview();
                    });
                }
            }
            else if (message.command === "handleSuggestion") {
                const res = this.responses.find((r) => r.id === message.id);
                if (!res)
                    return;
                vscode.commands
                    .executeCommand("extension.showRefactoringSuggestions")
                    .then(() => {
                    res.suggestionsVisible = true;
                    this.isLoading = false;
                    this.updateWebview();
                });
            }
        });
    }
    updateContent(newContent, responseType) {
        const timestamp = new Date().toLocaleTimeString();
        const ignoredMessages = [
            "No workspace folder is open",
            "No active editor found.",
            "The file is empty. Nothing to analyze.",
            "No design flaws found.",
        ];
        const hasValidContent = !ignoredMessages.includes(newContent.trim());
        this.responses.unshift({
            id: this.responseCounter++,
            content: newContent,
            timestamp,
            responseType,
            refactorState: responseType === "Solid Detection for File" && hasValidContent
                ? "show"
                : undefined,
            buttonDisabled: false,
            suggestionsVisible: false,
        });
        this.updateWebview();
    }
    deleteResponse(id) {
        this.responses = this.responses.filter((res) => res.id !== id);
        this.updateWebview();
    }
}
exports.default = ResponseSidebarProvider;
//# sourceMappingURL=responseSidebarProvider.js.map