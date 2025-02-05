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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log("CodeAid Extension is now active!");
    const provider = new CodeAidSidebarProvider(context.extensionUri);
    // ✅ Ensure the provider is registered with the correct view ID
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CodeAidSidebarProvider.viewType, provider));
}
class CodeAidSidebarProvider {
    _extensionUri;
    static viewType = "codeAidView"; // ✅ Ensure this matches the view ID in package.json
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.webview.html = this._getHtmlForWebview();
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === "generate") {
                vscode.window.showInformationMessage("Generate button clicked!");
            }
        });
    }
    _getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeAid</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    button { background: #007acc; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; }
                    button:hover { background: #005f99; }
                </style>
            </head>
            <body>
                <h2>CodeAid Features</h2>
                <button id="generateBtn">Generate</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    document.getElementById("generateBtn").addEventListener("click", () => {
                        vscode.postMessage({ command: "generate" });
                    });
                </script>
            </body>
            </html>
        `;
    }
}
//# sourceMappingURL=test.js.map