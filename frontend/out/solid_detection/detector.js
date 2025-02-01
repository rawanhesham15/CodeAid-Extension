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
exports.SOLIDDetector = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const project_formatter_1 = require("../utils/project_formatter");
const model_api_1 = require("./model_api");
const projectFormatter = new project_formatter_1.ProjectFormatter();
const modelAPI = new model_api_1.ModelAPI();
class SOLIDDetector {
    constructor() {
        this.analyzeProject = this.analyzeProject.bind(this);
        this.buildProjectPrompt = this.buildProjectPrompt.bind(this);
        this.writeResultToPDF = this.writeResultToPDF.bind(this);
    }
    async buildProjectPrompt(clusters) {
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
                const result = await modelAPI.sendPrompt(prompt);
                responses += result + "\n";
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to analyze.`);
                console.error("Model API error:", error);
            }
        }
        const finalPrompt = `Given the following responses, provide a summarized response that contain each principle and in front of it the classes that violated that principle\n${responses}`;
        try {
            const result = await modelAPI.sendPrompt(finalPrompt);
            this.writeResultToPDF(result);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze.`);
            console.error("Model API error:", error);
        }
    }
    writeResultToPDF(result) {
        const doc = new pdfkit_1.default();
        const pdfPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "Final_Analysis.pdf");
        const pdfStream = fs.createWriteStream(pdfPath);
        doc.pipe(pdfStream);
        doc.fontSize(16).text("Final Analysis Summary", { underline: true });
        doc.fontSize(12).text(result);
        doc.end();
        pdfStream.on("finish", () => {
            vscode.window.showInformationMessage(`Analysis saved to PDF: ${pdfPath}`);
        });
    }
    async analyzeProject() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const projectDir = workspaceFolders[0].uri.fsPath;
        const javaFiles = projectFormatter.getAllJavaFiles(projectDir);
        if (javaFiles.length === 0) {
            vscode.window.showErrorMessage("No Java files found in the project.");
            return;
        }
        const clusters = projectFormatter.buildClusters(javaFiles);
        await this.buildProjectPrompt(clusters);
    }
    async analyzeFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        const code = editor.document.getText();
        const prompt = `in only 100 words Detect if there is any SOLID principle violation in this code ${code}`;
        try {
            const result = await modelAPI.sendPrompt(prompt);
            vscode.window.showWarningMessage(`Violations detected: ${result}`);
        }
        catch (error) {
            vscode.window.showErrorMessage("Failed to connect to the model API.");
            console.error(error);
        }
    }
}
exports.SOLIDDetector = SOLIDDetector;
//# sourceMappingURL=detector.js.map