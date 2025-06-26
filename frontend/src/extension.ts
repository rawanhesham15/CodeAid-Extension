import * as vscode from "vscode";
import CodeAidSidebarProvider from "./UI/codeaidSidebarProvider";
import InputHandler from "./inputHandler";
import ResponseSidebarProvider from "./UI/responseSidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeAidSidebarProvider(context.extensionUri);
  const secProvider = new ResponseSidebarProvider(context.extensionUri);
  const inputHandler = new InputHandler();
  let fileRefactoringsSO: { filePath: string; fileContent: string }[];
  let lastMainFileDetectionS: string;
  let lastMainFileDetectionC: string;
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (workspacePath) {
    console.log("workspace exist");
    inputHandler.initProject(workspacePath).then(console.log);
  } else {
    console.log("no workspace");
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.detectSOLID",
      async (arg: string) => {
        const contextLabel = arg === "file" ? "File" : "Project";
        let res = await inputHandler.detectSOLID(arg);
        let title = "";
        if (contextLabel === "Project") title = " Solid Detection for Project";
        else title = "Solid Detection for File";
        lastMainFileDetectionS = res.path;
        secProvider.updateContent(res.message, title);
      }
    ),
    vscode.commands.registerCommand(
      "extension.detectCoupling",
      async (arg: string) => {
        const contextLabel = arg === "file" ? "File" : "Project";
        let res = await inputHandler.detectCoupling(arg);
        let title = "";
        if (contextLabel === "Project")
          title = " Coupling Smells Detection for Project";
        else title = "Coupling Smells Detection for File";
        lastMainFileDetectionC = res;
        secProvider.updateContent(res, title);
      }
    ),

    vscode.commands.registerCommand("extension.plotDiagram", async (arg) => {
      let res = await inputHandler.plotDiagram(arg);
      secProvider.updateContent(res, "Plotting ${arg} Diagram");
    }),

    vscode.commands.registerCommand("extension.displayRate", async () => {
      const res = await inputHandler.displayRate();
      // If the backend returns a warning string instead of complexity info
      if (
        res === "No active editor found." ||
        res === "The file is empty. Nothing to analyze." ||
        res === "No class exceeded the complexity threshold."
      ) {
        secProvider.updateContent(res, "Complexity Check");
      } else {
        secProvider.updateContent(res, "Displaying Complexity Rate");
      }
    }),

    vscode.commands.registerCommand(
      "extension.handleRefactorRequest",
      async () => {
        fileRefactoringsSO = await inputHandler.refactorSOViolations(
          lastMainFileDetectionS
        );
      }
    ),

    vscode.commands.registerCommand("extension.applyRefactoring", async () => {
      await inputHandler.applyAllRefactorings(fileRefactoringsSO);
    }),

    vscode.commands.registerCommand("extension.undo", async () => {
      const res = await inputHandler.undo(lastMainFileDetectionS, workspacePath!);
    }),

    vscode.commands.registerCommand(
      "extension.showRefactoringSuggestions",
      async () => {
        const res = await inputHandler.showRefactoringSuggestions(lastMainFileDetectionS);
        secProvider.updateContent(res, "Coupling smells refactoring suggestions")
      }
    ),

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
