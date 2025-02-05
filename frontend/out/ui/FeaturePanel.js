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
exports.FeaturePanel = void 0;
const vscode = __importStar(require("vscode"));
class FeaturePanel {
    static currentPanel;
    _panel;
    _extensionUri;
    constructor(panel, extensionUri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null);
        this._panel.webview.html = this._getHtmlForWebview();
    }
    static createOrShow(extensionUri) {
        if (FeaturePanel.currentPanel) {
            FeaturePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        }
        else {
            const panel = vscode.window.createWebviewPanel("featureView", "Features", vscode.ViewColumn.One, {
                enableScripts: true, // Allows JavaScript execution
            });
            FeaturePanel.currentPanel = new FeaturePanel(panel, extensionUri);
        }
    }
    _getHtmlForWebview() {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Features</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: white; }
          h2 { margin-bottom: 20px; }
          .button-container { display: flex; flex-direction: column; gap: 10px; }
          .feature-button { display: flex; align-items: center; padding: 10px; background: #2d2d2d; color: white; border: none; cursor: pointer; border-radius: 5px; font-size: 14px; }
          .feature-button:hover { background: #444; }
          .icon { margin-right: 10px; }
        </style>
      </head>
      <body>
        <h2>Features</h2>
        <div class="button-container">
          <button class="feature-button" onclick="vscode.postMessage({ command: 'fix' })">🔧 Fix</button>
          <button class="feature-button" onclick="vscode.postMessage({ command: 'explain' })">💡 Explain</button>
          <button class="feature-button" onclick="vscode.postMessage({ command: 'generateDoc' })">📄 Generate Code Documentation</button>
          <button class="feature-button" onclick="vscode.postMessage({ command: 'generateTest' })">🛠️ Generate Unit Test</button>
          <button class="feature-button" onclick="vscode.postMessage({ command: 'createProject' })">📁 Create Project File Architecture</button>
          <button class="feature-button" onclick="vscode.postMessage({ command: 'switchLanguage' })">🌍 Switch Code Language</button>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          document.querySelectorAll('.feature-button').forEach(button => {
            button.addEventListener('click', event => {
              vscode.postMessage({ command: event.target.innerText.toLowerCase().replace(/ /g, '') });
            });
          });
        </script>
      </body>
      </html>
    `;
    }
    dispose() {
        FeaturePanel.currentPanel = undefined;
        this._panel.dispose();
    }
}
exports.FeaturePanel = FeaturePanel;
//# sourceMappingURL=FeaturePanel.js.map