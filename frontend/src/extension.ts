import * as vscode from "vscode";
import CodeAidSidebarProvider from "./UI/codeaidSidebarProvider";
import InputHandler from "./inputHandler";
import ResponseSidebarProvider from "./UI/responseSidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeAidSidebarProvider(context.extensionUri);
  const secProvider = new ResponseSidebarProvider(context.extensionUri);
  const inputHandler = new InputHandler();

  // 🔁 Auto-call initProject if workspace is open
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (workspacePath) {
    console.log("workspace exist");
    inputHandler.initProject(workspacePath).then(console.log);
  }else{
    console.log("no workspace");
  }
  
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.detectSOLID", async (arg) => {
      let res = await inputHandler.detectSOLID(arg);
      secProvider.updateContent(res, "Solid Detection");
    }),
    vscode.commands.registerCommand("extension.detectCoupling", async () => {
      let res = await inputHandler.detectCoupling();
      secProvider.updateContent(res, "Coupling Smells Detection");
    }),
    vscode.commands.registerCommand("extension.plotDiagram", async (arg) => {
      let res = await inputHandler.plotDiagram(arg);
      secProvider.updateContent(res, `Plotting ${arg} Diagram`);
    }),
    vscode.commands.registerCommand("extension.displayRate", async () => {
      let res = await inputHandler.displayRate();
      secProvider.updateContent(res, "Dislpaying Complexity Rate");
    }),
    vscode.window.registerWebviewViewProvider(
      CodeAidSidebarProvider.viewType,
      provider
    ),
    vscode.window.registerWebviewViewProvider(
      ResponseSidebarProvider.viewType,
      secProvider
    )
  );
}

export function deactivate() {}
