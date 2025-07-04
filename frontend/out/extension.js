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
const codeaidSidebarProvider_1 = __importDefault(require("./UI/codeaidSidebarProvider"));
const inputHandler_1 = __importDefault(require("./inputHandler"));
const responseSidebarProvider_1 = __importDefault(require("./UI/responseSidebarProvider"));
const responseFormatter_1 = __importDefault(require("./responseFormatter"));
function activate(context) {
    const provider = new codeaidSidebarProvider_1.default(context.extensionUri);
    const secProvider = new responseSidebarProvider_1.default(context.extensionUri);
    const responseFormatter = new responseFormatter_1.default();
    const inputHandler = new inputHandler_1.default();
    let fileRefactoringsSO;
    let lastMainFileDetectionS;
    let lastMainFileDetectionC;
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (workspacePath) {
        console.log("workspace exist");
        inputHandler.initProject(workspacePath).then(console.log);
    }
    else {
        console.log("no workspace");
    }
    context.subscriptions.push(vscode.commands.registerCommand("extension.detectSOLID", async (arg) => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Detecting SOLID Violations",
            cancellable: false,
        }, async (progress) => {
            const contextLabel = arg === "file" ? "File" : "Project";
            progress.report({ message: `${contextLabel} Scope` });
            let res = await inputHandler.detectSOLID(arg);
            console.log(res);
            console.log(res.message);
            let title = "";
            let content = "";
            if (contextLabel === "Project") {
                title = "Solid Detection for Project";
            }
            else {
                title = "Solid Detection for File";
            }
            if (Array.isArray(res.message)) {
                content = responseFormatter.formatSResponse(res.message);
            }
            else
                content = res.message;
            lastMainFileDetectionS = res.path;
            secProvider.updateContent(content, title);
        });
    }), vscode.commands.registerCommand("extension.detectCoupling", async (arg) => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Detecting Coupling Smells",
            cancellable: false,
        }, async (progress) => {
            const contextLabel = arg === "file" ? "File" : "Project";
            progress.report({ message: `${contextLabel} Scope` });
            let res = await inputHandler.detectCoupling(arg);
            console.log("res", res);
            let title = "";
            let content = "";
            if (contextLabel === "Project") {
                title = "Coupling Smells Detection for Project";
            }
            else {
                title = "Coupling Smells Detection for File";
            }
            if (Array.isArray(res)) {
                content = responseFormatter.formatCResponse(res);
            }
            else
                content = res;
            // if (res[0].couplingSmells.length === 0) {
            //   content = "No coupling smells found";
            // } else content = responseFormatter.formatCResponse(res);
            lastMainFileDetectionC = res;
            secProvider.updateContent(content, title);
        });
    }), vscode.commands.registerCommand("extension.plotDiagram", async (arg) => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Plotting ${arg} Diagram...`,
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "" });
            let res = await inputHandler.plotDiagram(arg);
            secProvider.updateContent(res, `Plotting ${arg} Diagram`);
        });
    }), vscode.commands.registerCommand("extension.displayRate", async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Calculating Complexity Rate...",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "" });
            const res = await inputHandler.displayRate();
            let title = "Complexity Check";
            if (res === "No active editor found." ||
                res === "The file is empty. Nothing to analyze." ||
                res === "No class exceeded the complexity threshold.") {
                secProvider.updateContent(res, title);
            }
            else {
                title = "Displaying Complexity Rate";
                secProvider.updateContent(res, title);
            }
        });
    }), vscode.commands.registerCommand("extension.handleRefactorRequest", async () => {
        fileRefactoringsSO = await inputHandler.refactorSOViolations(lastMainFileDetectionS);
    }), vscode.commands.registerCommand("extension.applyRefactoring", async () => {
        await inputHandler.applyAllRefactorings(fileRefactoringsSO);
    }), vscode.commands.registerCommand("extension.undo", async () => {
        const res = await inputHandler.undo(lastMainFileDetectionS, workspacePath);
    }), vscode.commands.registerCommand("extension.showRefactoringSuggestions", async () => {
        const res = await inputHandler.showRefactoringSuggestions();
        const content = responseFormatter.formatSuggestionStepsResponse(res);
        secProvider.updateContent(content, "Coupling smells refactoring suggestions");
    }), vscode.window.registerWebviewViewProvider(codeaidSidebarProvider_1.default.viewType, provider), vscode.window.registerWebviewViewProvider(responseSidebarProvider_1.default.viewType, secProvider));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map