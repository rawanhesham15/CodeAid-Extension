import * as vscode from "vscode";
import CodeAidSidebarProvider from "./UI/codeaidSidebarProvider";
import InputHandler from "./inputHandler";
import ResponseSidebarProvider from "./UI/responseSidebarProvider";
import ResponseFormatter from "./responseFormatter";

export function activate(context: vscode.ExtensionContext) {
  const provider = new CodeAidSidebarProvider(context.extensionUri);
  const secProvider = new ResponseSidebarProvider(context.extensionUri);
  const responseFormatter = new ResponseFormatter();
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
        console.log("\n\n\nreturned", res.message);
        let title = "",
          content = "";
        if (contextLabel === "Project") {
          title = " Solid Detection for Project";
          content = responseFormatter.formatSResponse(res.message);
        } else {
          title = "Solid Detection for File";
          content = responseFormatter.formatSResponse(res.message);
        }
        lastMainFileDetectionS = res.path;
        secProvider.updateContent(content, title);
      }
    ),

    vscode.commands.registerCommand(
      "extension.detectCoupling",
      async (arg: string) => {
        const contextLabel = arg === "file" ? "File" : "Project";
        let res = await inputHandler.detectCoupling(arg);
        let title = "",
          content = "";
        if (contextLabel === "Project") {
          title = " Coupling Smells Detection for Project";
          content = responseFormatter.formatCResponse(res);
        } else {
          title = "Coupling Smells Detection for File";
          content = responseFormatter.formatCResponse(res);
        }
        lastMainFileDetectionC = res;
        secProvider.updateContent(content, title);
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
      const res = await inputHandler.undo(
        lastMainFileDetectionS,
        workspacePath!
      );
    }),

    vscode.commands.registerCommand(
      "extension.showRefactoringSuggestions",
      async () => {
        const res = await inputHandler.showRefactoringSuggestions();
        const content = responseFormatter.formatSuggestionStepsResponse(res)
        secProvider.updateContent(
          content,
          "Coupling smells refactoring suggestions"
        );
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
