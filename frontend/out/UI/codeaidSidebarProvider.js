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
class CodeAidSidebarProvider {
    _extensionUri;
    static viewType = "codeAidView";
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.html = this._getHtmlForWebview();
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "detectSolid": {
                    const context = message.context;
                    const label = context === "file" ? "File" : "Project";
                    vscode.commands.executeCommand("extension.detectSOLID", context, label);
                    break;
                }
                case "detectCoupling": {
                    const context = message.context;
                    const label = context === "file" ? "File" : "Project";
                    vscode.commands.executeCommand("extension.detectCoupling", context, label);
                    break;
                }
                case "plotDiagram":
                    vscode.commands.executeCommand("extension.plotDiagram", message.diagram);
                    break;
                case "displayRate":
                    vscode.commands.executeCommand("extension.displayRate");
                    break;
                case "refactorCode": {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage("No active editor found.");
                        return;
                    }
                    const currentPath = editor.document.uri.fsPath;
                    const currentContent = editor.document.getText();
                    vscode.commands.executeCommand("extension.refactorCode", currentPath, currentContent);
                    break;
                }
                case "undo": {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage("No active editor found.");
                        return;
                    }
                    const currentPath = editor.document.uri.fsPath;
                    vscode.commands.executeCommand("extension.undo", currentPath);
                    break;
                }
                case "refactorCouplingSmells":
                    vscode.commands.executeCommand("extension.refactorCouplingSmells");
            }
        });
    }
    _getHtmlForWebview() {
        const webview = this._view?.webview;
        const imageUri = webview?.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "logo.png"));
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CodeAid</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
        <style>
          body {
            font-family: "Outfit", sans-serif;
            padding: 10px;
            background-color: rgb(18, 18, 18);
            color: #e1e1e6;
            width: 295px;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            margin-left: 15px;
            font-size: 20px;
            font-weight: bold;
          }
          h3 {
            color: #e1e1e6;
          }
          .section {
            margin-bottom: 15px;
            margin-left: 35px;
          }
          button {
            font-family: "Outfit", sans-serif;
            background-color: #12738e;
            color: white;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            margin-top: 5px;
            transition: 0.5s;
            width: 80px;
          }
          button:hover {
            background-color: transparent;
            border: 1px solid #12738e;
            color: #12738e;
            transition: 0.5s;
          }
          .btn-container {
            display: flex;
            justify-content: end;
          }
          .flex-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          /* Custom dropdown */
          .dropdown {
            position: relative;
            width: 130px;
            user-select: none;
            font-family: "Outfit", sans-serif;
          }

          .dropdown-selected {
            background-color: #000;
            border: 1px solid #393939;
            color: #fff;
            padding: 7px 10px;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
          }

          .dropdown-options {
            display: none;
            position: absolute;
            background-color: #000;
            border: 1px solid #393939;
            border-top: none;
            width: 100%;
            z-index: 10;
            border-radius: 0 0 4px 4px;
          }

          .dropdown-option {
            padding: 7px 10px;
            color: #fff;
            cursor: pointer;
          }

          .dropdown-option:hover {
            background-color: #12738e;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${imageUri}" width="32" />
          <p style="line-height: 28px">&nbsp;&nbsp;CodeAid</p>
        </div>

        <div class="section">
          <div class="flex-wrapper">
            <h3>SOLID Detection</h3>
            <div class="dropdown" data-id="solidSelect">
              <div class="dropdown-selected" data-value="project">Project</div>
              <div class="dropdown-options">
                <div class="dropdown-option" data-value="project">Project</div>
                <div class="dropdown-option" data-value="file">File</div>
              </div>
            </div>
          </div>
          <div class="btn-container">
            <button id="detectSolid">Detect</button>
          </div>
        </div>

        <div class="section">
          <div class="flex-wrapper">
            <h3>Coupling smells <br> Detection</h3>
            <div class="dropdown" data-id="couplingSelect">
              <div class="dropdown-selected" data-value="project">Project</div>
              <div class="dropdown-options">
                <div class="dropdown-option" data-value="project">Project</div>
                <div class="dropdown-option" data-value="file">File</div>
              </div>
            </div>
          </div>
          <div class="btn-container">
            <button id="detectCoupling">Detect</button>
          </div>
        </div>

        <div class="section">
          <div class="flex-wrapper">
            <h3>Plot Diagrams</h3>
            <div class="dropdown" data-id="diagramSelect">
              <div class="dropdown-selected" data-value="class">Class</div>
              <div class="dropdown-options">
                <div class="dropdown-option" data-value="class">Class</div>
                <div class="dropdown-option" data-value="dependency">Dependency</div>
                <div class="dropdown-option" data-value="component">Component</div>
              </div>
            </div>
          </div>
          <div class="btn-container">
            <button id="plotDiagram">Plot</button>
          </div>
        </div>

        <div class="section">
          <h3>Display Complexity Rate</h3>
          <div class="btn-container">
            <button id="displayRateBtn">Display</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function setupDropdowns() {
            document.querySelectorAll(".dropdown").forEach(dropdown => {
              const selected = dropdown.querySelector(".dropdown-selected");
              const options = dropdown.querySelector(".dropdown-options");

              selected.addEventListener("click", () => {
                options.style.display = options.style.display === "block" ? "none" : "block";
              });

              options.querySelectorAll(".dropdown-option").forEach(option => {
                option.addEventListener("click", () => {
                  selected.textContent = option.textContent;
                  selected.setAttribute("data-value", option.getAttribute("data-value"));
                  options.style.display = "none";
                });
              });

              window.addEventListener("click", (e) => {
                if (!dropdown.contains(e.target)) {
                  options.style.display = "none";
                }
              });
            });
          }

          function getDropdownValue(id) {
            return document.querySelector(\`.dropdown[data-id="\${id}"] .dropdown-selected\`).getAttribute("data-value");
          }

          setupDropdowns();

          document.getElementById("detectSolid").addEventListener("click", () => {
            const solidContext = getDropdownValue("solidSelect");
            vscode.postMessage({ command: "detectSolid", context: solidContext });
          });

          document.getElementById("detectCoupling").addEventListener("click", () => {
            const couplingContext = getDropdownValue("couplingSelect");
            vscode.postMessage({ command: "detectCoupling", context: couplingContext });
          });

          document.getElementById("plotDiagram").addEventListener("click", () => {
            const diagram = getDropdownValue("diagramSelect");
            vscode.postMessage({ command: "plotDiagram", diagram });
          });

          document.getElementById("displayRateBtn").addEventListener("click", () => {
            vscode.postMessage({ command: "displayRate" });
          });
        </script>
      </body>
      </html>
    `;
    }
}
exports.default = CodeAidSidebarProvider;
//# sourceMappingURL=codeaidSidebarProvider.js.map