import * as vscode from "vscode";
import CodeAidSidebarProvider from "./UI/codeaidSidebarProvider";
import InputHandler from "./inputHandler";
import ResponseSidebarProvider from "./UI/responseSidebarProvider";
// 1 remove //
export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeAidSidebarProvider(context.extensionUri);
  const secProvider = new ResponseSidebarProvider(context.extensionUri);
  const inputHandler = new InputHandler();

  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (workspacePath) {
    console.log("workspace exist");
    inputHandler.initProject(workspacePath).then(console.log);
  } else {
    console.log("no workspace");
  }

  context.subscriptions.push(
vscode.commands.registerCommand("extension.detectSOLID", async (arg: string) => {
  const contextLabel = arg === "file" ? "File" : "Project";
  let res = await inputHandler.detectSOLID(arg);
  let title ="";
  if(contextLabel === "Project") 
     title =" Solid Detection for Project"; 
  else 
     title = "Solid Detection for File";
  const responseMessage = `**[${contextLabel} Scope]**\n\n${res}`;
  secProvider.updateContent(res, title);
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
      secProvider.updateContent(res, "Displaying Complexity Rate");
    }),
/////////////remove /////////////////////
vscode.commands.registerCommand("extension.refactorCode", async (path: string, content: string) => {
  let res = await inputHandler.refactorCode(path, content);
  secProvider.updateContent(res, "Refactor Result");
}),
vscode.commands.registerCommand("extension.undo", async (path : string) => {
  let res = await inputHandler.undo(path);
  secProvider.updateContent(res, "Undo Done");
}),
vscode.commands.registerCommand("extension.refactorCouplingSmells", async () => {
  let res = await inputHandler.refactorCouplingSmells();
  secProvider.updateContent(res, "Refactor Result");
}),
///////////////////////////////////
    vscode.window.registerWebviewViewProvider(CodeAidSidebarProvider.viewType, provider),
    vscode.window.registerWebviewViewProvider(ResponseSidebarProvider.viewType, secProvider)
  );
}

export function deactivate() {}
