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
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Detecting SOLID Violations",
            cancellable: false,
          },
          async (progress) => {
            const contextLabel = arg === "file" ? "File" : "Project";
            progress.report({ message: `${contextLabel} Scope` });
    
            let res = await inputHandler.detectSOLID(arg);
            console.log(res)
            console.log(res.message)
            let title = "";
            let content = "";
    
            if (contextLabel === "Project") {
              title = "Solid Detection for Project";
            } else {
              title = "Solid Detection for File";
            }

            if (Array.isArray(res.message)){
              content = responseFormatter.formatSResponse(res.message);
            }
            else content = res.message;
            lastMainFileDetectionS = res.path;
            secProvider.updateContent(content, title);
          }
        );
      }
    ),
    
    vscode.commands.registerCommand(
      "extension.detectCoupling",
      async (arg: string) => {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Detecting Coupling Smells",
            cancellable: false,
          },
          async (progress) => {
            const contextLabel = arg === "file" ? "File" : "Project";
            progress.report({message: `${contextLabel} Scope` });
    
            let res = await inputHandler.detectCoupling(arg);
    
            let title = "";
            let content = "";
    
            if (contextLabel === "Project") {
              title = "Coupling Smells Detection for Project";
            } else {
              title = "Coupling Smells Detection for File";
            }

            if (Array.isArray(res)){
              content = responseFormatter.formatCResponse(res);
            }
            else content = res;
            // if (res[0].couplingSmells.length === 0) {
            //   content = "No coupling smells found";
            // } else content = responseFormatter.formatCResponse(res);
    
            lastMainFileDetectionC = res;
            secProvider.updateContent(content, title);
          }
        );
      }
    ),
    
    vscode.commands.registerCommand(
      "extension.plotDiagram",
      async (arg) => {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Plotting ${arg} Diagram...`,
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: "" });
            let res = await inputHandler.plotDiagram(arg);
            secProvider.updateContent(res, `Plotting ${arg} Diagram`);
          }
        );
      }
    ),
    
    vscode.commands.registerCommand(
      "extension.displayRate",
      async () => {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Calculating Complexity Rate...",
            cancellable: false,
          },
          async (progress) => {
            progress.report({message: "" });
            const res = await inputHandler.displayRate();
    
            let title = "Complexity Check";
            if (
              res === "No active editor found." ||
              res === "The file is empty. Nothing to analyze." ||
              res === "No class exceeded the complexity threshold."
            ) {
              secProvider.updateContent(res, title);
            } else {
              title = "Displaying Complexity Rate";
              secProvider.updateContent(res, title);
            }
          }
        );
      }
    ),    

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
