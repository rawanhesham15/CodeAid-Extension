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
function activate(context) {
    const provider = new codeaidSidebarProvider_1.default(context.extensionUri);
    const secProvider = new responseSidebarProvider_1.default(context.extensionUri);
    const inputHandler = new inputHandler_1.default();
    context.subscriptions.push(vscode.commands.registerCommand("extension.detectSOLID", async (arg) => {
        let res = await inputHandler.detectSOLID(arg);
        secProvider.updateContent(res);
    }), vscode.commands.registerCommand("extension.detectCoupling", async () => {
        let res = await inputHandler.detectCoupling();
        secProvider.updateContent(res);
    }), vscode.commands.registerCommand("extension.plotDiagram", async (arg) => {
        let res = await inputHandler.plotDiagram(arg);
        secProvider.updateContent(res);
    }), vscode.commands.registerCommand("extension.displayRate", async () => {
        let res = await inputHandler.displayRate();
        secProvider.updateContent(res);
    }), vscode.window.registerWebviewViewProvider(codeaidSidebarProvider_1.default.viewType, provider), vscode.window.registerWebviewViewProvider(responseSidebarProvider_1.default.viewType, secProvider));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map