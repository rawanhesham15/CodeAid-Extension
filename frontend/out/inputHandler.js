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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
// 1 remove 
class InputHandler {
    workspacePath;
    constructor() {
        this.workspacePath = this.getWorkSpacePath();
    }
    getWorkSpacePath() {
        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspacePath) {
            return "";
        }
        return workspacePath;
    }
    getActiveEditorPath() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return "";
        }
        const filePath = editor.document.uri.fsPath;
        return [filePath, editor];
    }
    async detectSOLID(context) {
        let path = "";
        if (context == "project") {
            if (this.workspacePath == "")
                return "No workspace folder is open";
            path = this.workspacePath;
        }
        else {
            const result = this.getActiveEditorPath();
            if (result == "")
                return "No active editor found.";
            const filePath = result[0];
            const editor = result[1];
            const fileContent = editor.document.getText();
            if (!fileContent.trim()) {
                return "The file is empty. Nothing to analyze.";
            }
            path = filePath;
        }
        try {
            const response = await axios_1.default.post("http://localhost:3000/detect/solid", {
                path: path,
                context: context,
            });
            const responseData = response.data;
            if (responseData && responseData.message) {
                return responseData.message;
            }
            return "";
        }
        catch (error) {
            let errorMessage = "An error occurred while analyzing.";
            if (error.response) {
                errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
            }
            else if (error.request) {
                errorMessage += " No response from the server. Is it running?";
            }
            else {
                errorMessage += ` ${error.message}`;
            }
            return errorMessage;
        }
    }
    async detectCoupling(context) {
        let path = "";
        if (context === "project") {
            if (this.workspacePath === "")
                return "No workspace folder is open";
            path = this.workspacePath;
        }
        else {
            const result = this.getActiveEditorPath();
            if (result === "")
                return "No active editor found.";
            const filePath = result[0];
            const editor = result[1];
            const fileContent = editor.document.getText();
            if (!fileContent.trim()) {
                return "The file is empty. Nothing to analyze.";
            }
            path = filePath;
            console.log(path, "from frontend");
        }
        try {
            const response = await axios_1.default.post("http://localhost:3000/detect/couplingsmells", {
                path: path,
                context: context,
            });
            const responseData = response.data;
            if (responseData && responseData.message) {
                return responseData.message;
            }
            return "";
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
            return errorMessage;
        }
    }
    async plotDiagram(type) {
        const workspacePath = this.getWorkSpacePath();
        if (workspacePath == "")
            return "No workspace folder is open";
        try {
            const response = await axios_1.default.post(`http://localhost:3000/plot/${type}`, {
                path: workspacePath,
            });
            const responseData = response.data;
            if (responseData && responseData.path) {
                return `Diagram generated at ${responseData.path}`;
            }
            return "";
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
            return errorMessage;
        }
    }
    async displayRate() {
        let complexityDataMap = new Map();
        const workspaceFolder = this.getWorkSpacePath();
        const result = this.getActiveEditorPath();
        if (result == "")
            return "No active editor found.";
        const filePath = result[0];
        const editor = result[1];
        const fileContent = editor.document.getText();
        if (!fileContent.trim()) {
            return "The file is empty. Nothing to analyze.";
        }
        try {
            const response = await axios_1.default.post("http://localhost:3000/rateCalc/complexity", {
                path: filePath,
            });
            const responseData = response.data;
            const decorations = [];
            complexityDataMap.clear();
            responseData.data.forEach((fileData) => {
                complexityDataMap.set(fileData.file, fileData.classes);
            });
            if (editor) {
                responseData.data.forEach((fileData) => {
                    if (filePath === fileData.file) {
                        fileData.classes.forEach((cls) => {
                            const text = editor.document.getText();
                            const regex = new RegExp(`class\\s+${cls.name}\\b`, "g");
                            let match;
                            while ((match = regex.exec(text)) !== null) {
                                let startPos = editor.document.positionAt(match.index);
                                let aboveClassPos = new vscode.Position(Math.max(startPos.line - 1, 0), 0);
                                const decoration = {
                                    range: new vscode.Range(aboveClassPos, aboveClassPos),
                                    renderOptions: {
                                        before: {
                                            contentText: `Complexity: ${cls.rate}`,
                                            color: "gray",
                                            fontStyle: "italic",
                                            marginBottom: "5px",
                                        },
                                    },
                                };
                                decorations.push(decoration);
                            }
                        });
                    }
                });
            }
            const decorationType = vscode.window.createTextEditorDecorationType({});
            editor?.setDecorations(decorationType, decorations);
            return "Complexity rates calculated.";
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
            return errorMessage;
        }
    }
    async initProject(workspacePath) {
        try {
            const response = await fetch('http://localhost:3000/db/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspacePath, threshold: 80 }),
            });
            const data = await response.json();
            return `Project initialized: ${JSON.stringify(data)}`;
        }
        catch (err) {
            return `Error initializing project: ${err.message}`;
        }
    }
    ///////////////////////////remove////////////////////////
    async refactorCode(path, content) {
        if (!path || !content)
            return "Missing path or content.";
        try {
            const response = await axios_1.default.post("http://localhost:3000/refactor/solid", {
                path: path,
                content: content,
            });
            const responseData = response.data;
            if (responseData && responseData.refactoredCode) {
                const edit = new vscode.WorkspaceEdit();
                const document = await vscode.workspace.openTextDocument(path);
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                edit.replace(document.uri, fullRange, responseData.refactoredCode);
                await vscode.workspace.applyEdit(edit);
                return "Code has been refactored.";
            }
            return "No refactored code received.";
        }
        catch (error) {
            let errorMessage = "An error occurred during refactoring.";
            if (error.response) {
                errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
            }
            else if (error.request) {
                errorMessage += " No response from the server. Is it running?";
            }
            else {
                errorMessage += ` ${error.message}`;
            }
            return errorMessage;
        }
    }
    async refactorCouplingSmells() {
        const javaFiles = await vscode.workspace.findFiles("**/*.java");
        if (javaFiles.length === 0) {
            return "No Java files found in the workspace.";
        }
        const refactoredFiles = {};
        const fileContents = {};
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
        // Read and prepare files
        for (const uri of javaFiles) {
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const relativePath = vscode.workspace.asRelativePath(uri.fsPath);
            fileContents[relativePath] = content;
        }
        try {
            const response = await axios_1.default.post("http://localhost:3000/refactor/couplingsmells", {
                projectRoot: workspaceFolder,
                files: fileContents,
            });
            const data = response.data?.refactoredFiles;
            if (!data || Object.keys(data).length === 0) {
                return "No refactored files received.";
            }
            // Apply edits
            const edit = new vscode.WorkspaceEdit();
            for (const [relativePath, newContent] of Object.entries(data)) {
                if (typeof newContent !== 'string') {
                    continue; // Skip if not a string
                }
                const absolutePath = vscode.Uri.file(path.join(workspaceFolder, relativePath));
                const document = await vscode.workspace.openTextDocument(absolutePath);
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                edit.replace(document.uri, fullRange, newContent); // ✅ newContent is now string
            }
            await vscode.workspace.applyEdit(edit);
            return "All Java files have been refactored for coupling smells.";
        }
        catch (error) {
            let errorMessage = "An error occurred during coupling smell refactoring.";
            if (error.response) {
                errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
            }
            else if (error.request) {
                errorMessage += " No response from the server. Is it running?";
            }
            else {
                errorMessage += ` ${error.message}`;
            }
            return errorMessage;
        }
    }
    async undo(filePath) {
        try {
            const response = await axios_1.default.post("http://localhost:3000/refactor/undo", {
                path: filePath,
            });
            const lastState = response.data.lastState;
            if (!lastState || lastState.length === 0) {
                vscode.window.showInformationMessage("No undo states found.");
                return "No undo states found.";
            }
            for (const file of lastState) {
                const uri = vscode.Uri.file(file.filePath);
                let document;
                try {
                    // Try opening the document
                    document = await vscode.workspace.openTextDocument(uri);
                }
                catch (err) {
                    // If not found, create a new one with the content
                    const dirPath = vscode.Uri.file(require("path").dirname(file.filePath));
                    await vscode.workspace.fs.createDirectory(dirPath);
                    const encoder = new TextEncoder();
                    const fileContent = encoder.encode(file.content);
                    await vscode.workspace.fs.writeFile(uri, fileContent);
                    document = await vscode.workspace.openTextDocument(uri);
                }
                const editor = await vscode.window.showTextDocument(document, { preview: false });
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, file.content);
                });
                await document.save();
            }
            vscode.window.showInformationMessage("Undo completed for all files.");
            return "Undo completed for all files.";
        }
        catch (error) {
            vscode.window.showErrorMessage(`Undo failed: ${error}`);
            return `Undo failed: ${error instanceof Error ? error.message : error}`;
        }
    }
}
exports.default = InputHandler;
//# sourceMappingURL=inputHandler.js.map