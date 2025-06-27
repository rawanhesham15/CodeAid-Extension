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
exports.contentMap = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
const url_1 = require("url");
const scheme = "refactor";
exports.contentMap = new Map();
let providerRegistered = false;
class RefactorContentProvider {
    provideTextDocumentContent(uri) {
        return exports.contentMap.get(uri.toString()) || "";
    }
}
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
        let rootDir = this.workspacePath;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            rootDir = workspaceFolders[0].uri.fsPath;
        }
        if (context === "project") {
            if (!rootDir)
                return { message: "No workspace folder is open", path: "" };
            path = rootDir;
        }
        else {
            const result = this.getActiveEditorPath();
            if (result === "")
                return { message: "No active editor found.", path: "" };
            const filePath = result[0];
            const editor = result[1];
            const fileContent = editor.document.getText();
            if (!fileContent.trim()) {
                return { message: "The file is empty. Nothing to analyze.", path: "" };
            }
            path = filePath;
        }
        try {
            const response = await axios_1.default.post("http://localhost:3000/detect/solid", {
                path: path,
                context: context,
                rootDir: rootDir,
            });
            const responseData = response.data;
            if (responseData && responseData.message) {
                return { message: responseData.message, path: path };
            }
            return { message: "No response returned", path: path };
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
            return { message: errorMessage, path: path };
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
            // responseData.data.forEach((fileData: any) => {
            //   complexityDataMap.set(fileData.file, fileData.classes);
            // });
            let hasComplexity = false;
            responseData.data.forEach((fileData) => {
                complexityDataMap.set(fileData.file, fileData.classes);
                if (fileData.classes && fileData.classes.length > 0) {
                    hasComplexity = true;
                }
            });
            if (!hasComplexity) {
                return "No class exceeded the complexity threshold.";
            }
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
            const response = await fetch("http://localhost:3000/db/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspacePath, threshold: 80 }),
            });
            const data = await response.json();
            return `Project initialized: ${JSON.stringify(data)}`;
        }
        catch (err) {
            return `Error initializing project: ${err.message}`;
        }
    }
    async refactorSOViolations(mainFilePath) {
        if (!path)
            return [];
        try {
            const response = await axios_1.default.post("http://localhost:3000/refactor/solid", {
                path: mainFilePath,
                rootDir: this.workspacePath,
            });
            console.log(response);
            const responseData = response.data.data;
            console.log(responseData);
            this.showRefactorDiffs(responseData);
            return responseData;
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
            return [];
        }
    }
    async showRefactoringSuggestions() {
        let response;
        try {
            response = await axios_1.default.post("http://localhost:3000/refactor/couplingsmells", {
                rootDir: this.workspacePath,
            });
            console.log("Response:", response);
            const data = response?.data?.data?.suggestions;
            console.log("Response data:", data);
            return data;
        }
        catch (error) {
            console.error("Error fetching suggestions:", error.message);
            return "Error fetching refactoring suggestions.";
        }
    }
    async undo(mainFilePath, projectPath) {
        try {
            const response = await axios_1.default.post("http://localhost:3000/refactor/undo", {
                path: mainFilePath,
                project: projectPath,
            });
            const lastState = response.data.lastState;
            if (!lastState || lastState.length === 0) {
                vscode.window.showInformationMessage("No undo states found.");
                return "No undo states found.";
            }
            for (const file of lastState) {
                const uri = vscode.Uri.file(file.filePath);
                try {
                    // Ensure directory exists
                    const dirPath = vscode.Uri.file(require("path").dirname(file.filePath));
                    await vscode.workspace.fs.createDirectory(dirPath);
                    // Write new content directly
                    const encoder = new TextEncoder();
                    const contentBytes = encoder.encode(file.content);
                    await vscode.workspace.fs.writeFile(uri, contentBytes);
                }
                catch (err) {
                    vscode.window.showWarningMessage(`Failed to write file: ${file.filePath}`);
                    console.error(`Error writing file ${file.filePath}`, err);
                }
            }
            vscode.window.showInformationMessage("Undo completed for all files.");
            return "Undo completed for all files.";
        }
        catch (error) {
            vscode.window.showErrorMessage(`Undo failed: ${error}`);
            return `Undo failed: ${error instanceof Error ? error.message : error}`;
        }
    }
    async showRefactorDiffs(refactoredFiles) {
        console.log("recieved", refactoredFiles);
        if (!providerRegistered) {
            const provider = new RefactorContentProvider();
            vscode.workspace.registerTextDocumentContentProvider(scheme, provider);
            providerRegistered = true;
        }
        let columnIndex = 2;
        for (const { filePath, fileContent: newContent } of refactoredFiles) {
            try {
                const oldUri = vscode.Uri.file(filePath);
                // Try to read the old content; if file doesn't exist, create it empty
                let oldContent;
                try {
                    const buffer = await vscode.workspace.fs.readFile(oldUri);
                    oldContent = buffer.toString();
                }
                catch (err) {
                    if (err.code === "FileNotFound" || err.name === "FileNotFound") {
                        // Create empty file
                        await vscode.workspace.fs.writeFile(oldUri, new Uint8Array());
                        oldContent = "";
                    }
                    else {
                        throw err;
                    }
                }
                // Skip diff if no change
                if (oldContent === newContent)
                    continue;
                // Build custom scheme URIs
                const originalUri = vscode.Uri.parse(`${scheme}://${filePath}.original`);
                const basePath = (0, url_1.pathToFileURL)(filePath).pathname;
                const refactoredUri = vscode.Uri.parse(`${scheme}:${basePath}.refactored`);
                // Register content
                exports.contentMap.set(originalUri.toString(), oldContent);
                exports.contentMap.set(refactoredUri.toString(), newContent);
                const diffTitle = `Refactor Diff: ${path.basename(filePath)}`;
                const viewColumn = columnIndex > 2 ? vscode.ViewColumn.Active : columnIndex;
                await vscode.commands.executeCommand("vscode.diff", originalUri, refactoredUri, diffTitle, { viewColumn, preserveFocus: true, preview: false });
                columnIndex++;
            }
            catch (err) {
                vscode.window.showErrorMessage(`Error showing diff for ${filePath}: ${err}`);
            }
        }
    }
    async applyAllRefactorings(refactoredFiles) {
        try {
            for (const { filePath, fileContent } of refactoredFiles) {
                const uri = vscode.Uri.file(filePath);
                await vscode.workspace.fs.writeFile(uri, Buffer.from(fileContent, "utf8"));
            }
            vscode.window.showInformationMessage("All refactorings applied successfully!");
            await vscode.commands.executeCommand("workbench.action.closeAllEditors");
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to apply all refactorings: ${err}`);
        }
    }
}
exports.default = InputHandler;
//# sourceMappingURL=inputHandler.js.map