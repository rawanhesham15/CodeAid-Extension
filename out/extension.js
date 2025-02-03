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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const generative_ai_1 = require("@google/generative-ai");
const apiKey = "AIzaSyC-bBVVstUGkTLEW_PE5pvs-nSJiOtvuho";
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
function activate(context) {
    const analyzeProjectCommand = vscode.commands.registerCommand("extension.analyzeProject", analyzeProject);
    const analyzeFileCommand = vscode.commands.registerCommand("extension.analyzeFile", analyzeFile);
    // Register the view provider
    // const viewProvider = new MyCustomViewProvider(context.extensionUri);
    // context.subscriptions.push(
    //     vscode.window.registerWebviewViewProvider("myView",viewProvider)
    // );
    const myTreeDataProvider = new MyTreeDataProvider();
    vscode.window.registerTreeDataProvider('myView', myTreeDataProvider);
    context.subscriptions.push(analyzeProjectCommand);
    context.subscriptions.push(analyzeFileCommand);
}
function deactivate() { }
function getAllJavaFiles(dir) {
    let javaFiles = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            javaFiles = javaFiles.concat(getAllJavaFiles(fullPath));
        }
        else if (file.endsWith(".java")) {
            javaFiles.push(fullPath);
        }
    }
    return javaFiles;
}
function extractImports(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const importLines = content.match(/^import\s+([\w.]+);/gm) || [];
    return importLines.map((line) => line.replace(/^import\s+|;$/g, "").trim());
}
function buildClusters(files) {
    const dependencyGraph = new Map();
    const filePathMap = new Map();
    files.forEach((file) => {
        const baseName = path.basename(file, ".java");
        filePathMap.set(baseName, file);
    });
    for (const file of files) {
        const imports = extractImports(file);
        const fileName = path.basename(file, ".java");
        if (!dependencyGraph.has(fileName)) {
            dependencyGraph.set(fileName, new Set());
        }
        imports.forEach((imported) => {
            const importedFileName = imported.split(".").pop();
            if (filePathMap.has(importedFileName)) {
                dependencyGraph.get(fileName)?.add(importedFileName);
            }
        });
    }
    const clusters = new Set();
    for (const [file, dependencies] of dependencyGraph.entries()) {
        const cluster = new Set();
        cluster.add(filePathMap.get(file));
        dependencies.forEach((dep) => cluster.add(filePathMap.get(dep)));
        clusters.add(cluster);
    }
    return clusters;
}
async function sendClustersToModel(clusters) {
    let responses = "";
    for (const cluster of clusters) {
        const combinedCode = Array.from(cluster)
            .map((file) => fs.readFileSync(file, "utf-8"))
            .join("\n");
        const prompt = `Analyze the following Java code and identify violations of the SOLID principles. For each violation, provide:
1. The principle violated.
2. The specific part of the code responsible.
3. A brief explanation of why the violation occurs:\n\n${combinedCode}`;
        try {
            const result = await model.generateContent(prompt);
            responses += result.response.text() + "\n";
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze.`);
            console.error("Model API error:", error);
        }
    }
    const finalPrompt = `Given the following responses, provide a summarized response that contain each principle and in front of it the classes that violated that principle\n${responses}`;
    try {
        const finalResult = await model.generateContent(finalPrompt);
        const summary = finalResult.response.text();
        const doc = new pdfkit_1.default();
        const pdfPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "Final_Analysis.pdf");
        const pdfStream = fs.createWriteStream(pdfPath);
        doc.pipe(pdfStream);
        doc.fontSize(16).text("Final Analysis Summary", { underline: true });
        doc.fontSize(12).text(summary);
        doc.end();
        pdfStream.on("finish", () => {
            vscode.window.showInformationMessage(`Analysis saved to PDF: ${pdfPath}`);
        });
    }
    catch (error) {
        vscode.window.showErrorMessage("Failed to generate final analysis.");
        console.error("Model API error:", error);
    }
}
async function analyzeProject() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
    }
    const projectDir = workspaceFolders[0].uri.fsPath;
    const javaFiles = getAllJavaFiles(projectDir);
    if (javaFiles.length === 0) {
        vscode.window.showErrorMessage("No Java files found in the project.");
        return;
    }
    const clusters = buildClusters(javaFiles);
    await sendClustersToModel(clusters);
}
async function analyzeFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
    }
    const code = editor.document.getText();
    const prompt = `in only 100 words Detect if there is any SOLID principle violation in this code ${code}`;
    try {
        const result = await model.generateContent(prompt);
        const violations = result.response.text();
        vscode.window.showWarningMessage(`Violations detected: ${violations}`);
    }
    catch (error) {
        vscode.window.showErrorMessage("Failed to connect to the model API.");
        console.error(error);
    }
}
class MyTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return [
                this.createButton("Analyze the project", "extension.analyzeProject"),
                this.createButton("Analyze current file", "extension.analyzeFile"),
            ];
        }
        return [];
    }
    createButton(label, command) {
        const treeItem = new vscode.TreeItem(label);
        treeItem.command = {
            command: command,
            title: label,
        };
        treeItem.tooltip = `Click to execute ${label}`;
        treeItem.iconPath = new vscode.ThemeIcon("debug-start"); // Use a built-in icon
        return treeItem;
    }
}
//# sourceMappingURL=extension.js.map