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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const commandsPanel_1 = require("./UI/commandsPanel");
const axios = require("axios");
function activate(context) {
    const analyzeProjectCommand = vscode.commands.registerCommand("extension.analyzeProject", analyzeProject);
    const analyzeFileCommand = vscode.commands.registerCommand("extension.analyzeFile", analyzeFile);
    const plotClassDiagramCommand = vscode.commands.registerCommand("extension.plotClassDiagram", plotClassDiagram);
    const plotArchitectureDiagramCommand = vscode.commands.registerCommand("extension.plotArchitectureDiagram", plotArchitectureDiagram);
    const plotDepDiagramCommand = vscode.commands.registerCommand("extension.plotDependencyDiagram", plotDependencyDiagram);
    const displayRateCommand = vscode.commands.registerCommand("extension.displayRate", displayRate);
    const myTreeDataProvider = new commandsPanel_1.MyTreeDataProvider();
    vscode.window.registerTreeDataProvider("myView", myTreeDataProvider);
    context.subscriptions.push(vscode.commands.registerCommand("extension.refreshTree", () => {
        myTreeDataProvider.refresh();
    }));
    context.subscriptions.push(analyzeProjectCommand);
    context.subscriptions.push(analyzeFileCommand);
    context.subscriptions.push(plotClassDiagramCommand);
    context.subscriptions.push(plotArchitectureDiagramCommand);
    context.subscriptions.push(plotDepDiagramCommand);
    context.subscriptions.push(displayRateCommand);
}
function deactivate() { }
async function analyzeProject() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
    }
    try {
        const response = await axios.post("http://localhost:3000/detect/solid", {
            path: workspaceFolder,
            context: "project",
        });
        const responseData = response.data;
        if (responseData && responseData.message) {
            vscode.window.showInformationMessage(`Analysis Result: ${responseData.message}`);
        }
    }
    catch (error) {
        let errorMessage = "An error occurred while analyzing the file.";
        if (error.response) {
            errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        }
        else if (error.request) {
            errorMessage += " No response from the server. Is it running?";
        }
        else {
            errorMessage += ` ${error.message}`;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
}
async function analyzeFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
    }
    const filePath = editor.document.uri.fsPath;
    const fileContent = editor.document.getText();
    if (!fileContent.trim()) {
        vscode.window.showWarningMessage("The file is empty. Nothing to analyze.");
        return;
    }
    try {
        const response = await axios.post("http://localhost:3000/detect/solid", {
            path: filePath,
            context: "file",
        });
        const responseData = response.data;
        if (responseData && responseData.message) {
            vscode.window.showInformationMessage(`Analysis Result: ${responseData.message}`);
        }
    }
    catch (error) {
        let errorMessage = "An error occurred while analyzing the file.";
        if (error.response) {
            errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        }
        else if (error.request) {
            errorMessage += " No response from the server. Is it running?";
        }
        else {
            errorMessage += ` ${error.message}`;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
}
async function plotClassDiagram() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
    }
    try {
        const response = await axios.post("http://localhost:3000/plot/class", {
            path: workspaceFolder,
        });
        const responseData = response.data;
        if (responseData && responseData.path) {
            vscode.window.showInformationMessage(`Class diagram generated at  ${responseData.path}`);
        }
    }
    catch (error) {
        let errorMessage = "An error occurred while generating the diagram.";
        if (error.response) {
            errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        }
        else if (error.request) {
            errorMessage += " No response from the server. Is it running?";
        }
        else {
            errorMessage += ` ${error.message}`;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
}
async function plotArchitectureDiagram() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
    }
    try {
        const response = await axios.post("http://localhost:3000/plot/architecture", {
            path: workspaceFolder,
        });
        const responseData = response.data;
        if (responseData && responseData.path) {
            vscode.window.showInformationMessage(`Architecture diagram generated at  ${responseData.path}`);
        }
    }
    catch (error) {
        let errorMessage = "An error occurred while generating the diagram.";
        if (error.response) {
            errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        }
        else if (error.request) {
            errorMessage += " No response from the server. Is it running?";
        }
        else {
            errorMessage += ` ${error.message}`;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
}
async function plotDependencyDiagram() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
    }
    try {
        const response = await axios.post("http://localhost:3000/plot/dependency", {
            path: workspaceFolder,
        });
        const responseData = response.data;
        if (responseData && responseData.path) {
            vscode.window.showInformationMessage(`Dependency diagram generated at  ${responseData.path}`);
        }
    }
    catch (error) {
        let errorMessage = "An error occurred while generating the diagram.";
        if (error.response) {
            errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        }
        else if (error.request) {
            errorMessage += " No response from the server. Is it running?";
        }
        else {
            errorMessage += ` ${error.message}`;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
}
async function displayRate() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
    }
    try {
        const response = await axios.post("http://localhost:3000/rateCalc/complexity", {
            path: workspaceFolder,
        });
        const responseData = response.data;
        if (responseData) {
            vscode.window.showInformationMessage(`Complexity rates are generated`);
        }
    }
    catch (error) {
        let errorMessage = "An error occurred while calculating the rates.";
        if (error.response) {
            errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        }
        else if (error.request) {
            errorMessage += " No response from the server. Is it running?";
        }
        else {
            errorMessage += ` ${error.message}`;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
}
//# sourceMappingURL=extension.js.map