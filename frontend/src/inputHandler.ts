import * as vscode from "vscode";
import axios, { get } from "axios";
import * as path from "path";
import { pathToFileURL } from "url";
import { read } from "fs";
import os from "os";

const scheme = "refactor";
export const contentMap = new Map<string, string>();
let providerRegistered = false;

class RefactorContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(uri: vscode.Uri): string {
    return contentMap.get(uri.toString()) || "";
  }
}
class InputHandler {
  workspacePath: string;
  constructor() {
    this.workspacePath = this.getWorkSpacePath();
  }

  getWorkSpacePath(): string {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspacePath) {
      return "";
    }
    return workspacePath;
  }

  getActiveEditorPath(): Object {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return "";
    }
    const filePath = editor.document.uri.fsPath;
    return [filePath, editor];
  }

  async detectSOLID(context: string): Promise<{ message: any; path: string }> {
    let path: string = "";
    let rootDir: string = this.workspacePath;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      rootDir = workspaceFolders[0].uri.fsPath;
    }

    if (context === "project") {
      if (!rootDir) return { message: "No workspace folder is open", path: "" };
      path = rootDir;
    } else {
      const result: any = this.getActiveEditorPath();
      if (result === "")
        return { message: "No active editor found.", path: "" };
      const filePath: string = result[0];
      const editor: any = result[1];
      const fileContent = editor.document.getText();
      if (!fileContent.trim()) {
        return { message: "The file is empty. Nothing to analyze.", path: "" };
      }
      path = filePath;
    }

    try {
      const response = await axios.post("http://localhost:3000/detect/solid", {
        path: path,
        context: context,
        rootDir: rootDir,
      });

      const responseData = response.data;
      if (responseData && responseData.message) {
        console.log(responseData.message);
        return { message: responseData.message, path: path };
      }
      return { message: "No response returned", path: path };
    } catch (error: any) {
      let errorMessage = "An error occurred while analyzing.";
      if (error.response) {
        errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
      } else if (error.request) {
        errorMessage += " No response from the server. Is it running?";
      } else {
        errorMessage += ` ${error.message}`;
      }

      return { message: errorMessage, path: path };
    }
  }

  async detectCoupling(context: string): Promise<any> {
    let path: String = "";
    if (context === "project") {
      if (this.workspacePath === "") return "No workspace folder is open";
      path = this.workspacePath;
    } else {
      const result: any = this.getActiveEditorPath();
      if (result === "") return "No active editor found.";
      const filePath: String = result[0];
      const editor: any = result[1];
      const fileContent = editor.document.getText();
      if (!fileContent.trim()) {
        return "The file is empty. Nothing to analyze.";
      }
      path = filePath;
      console.log(path, "from frontend");
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/detect/couplingsmells",
        {
          path: path,
          context: context,
        }
      );

      const responseData = response.data;

      if (responseData && responseData.message) {
        return responseData.message;
      }
      return "";
    } catch (error: any) {
      let errorMessage = "An error occurred while analyzing the file.";

      if (error.response) {
        errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
      } else if (error.request) {
        errorMessage += " No response from the server. Is it running?";
      } else {
        errorMessage += ` ${error.message}`;
      }
      return errorMessage;
    }
  }

  async plotDiagram(type: String): Promise<string> {
    const workspacePath = this.getWorkSpacePath();
    if (workspacePath == "") return "No workspace folder is open";
    try {
      const response = await axios.post(`http://localhost:3000/plot/${type}`, {
        path: workspacePath,
      });
      const responseData = response.data;
      if (responseData && responseData.path) {
        return `Diagram generated at ${responseData.path}`;
      }
      return responseData.message;
    } catch (error: any) {
      let errorMessage = "An error occurred while generating the diagram.";

      if (error.response) {
        errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
      } else if (error.request) {
        errorMessage += " No response from the server. Is it running?";
      } else {
        errorMessage += ` ${error.message}`;
      }

      return errorMessage;
    }
  }

  async displayRate(): Promise<string> {
    let complexityDataMap: Map<string, any[]> = new Map();
    const workspaceFolder = this.getWorkSpacePath();
    const result: any = this.getActiveEditorPath();
    if (result == "") return "No active editor found.";
    const filePath: String = result[0];
    const editor: any = result[1];
    const fileContent = editor.document.getText();
    if (!fileContent.trim()) {
      return "The file is empty. Nothing to analyze.";
    }
    try {
      const response = await axios.post(
        "http://localhost:3000/rateCalc/complexity",
        {
          path: filePath,
          projectDir: this.getWorkSpacePath()
        }
      );

      const responseData = response.data;

      if (typeof responseData === "string") {
        return responseData;
      }

      if (!responseData || !Array.isArray(responseData.data)) {
        return "Unexpected server response: missing complexity data.";
      }

      const decorations: vscode.DecorationOptions[] = [];

      complexityDataMap.clear();

      let hasComplexity = false;

      responseData.data.forEach((fileData: any) => {
        complexityDataMap.set(fileData.file, fileData.classes);
        if (fileData.classes && fileData.classes.length > 0) {
          hasComplexity = true;
        }
      });

      if (!hasComplexity) {
        return "No class exceeded the complexity threshold.";
      }

      if (editor) {
        responseData.data.forEach((fileData: any) => {
          if (filePath === fileData.file) {
            fileData.classes.forEach((cls: any) => {
              const text = editor.document.getText();
              const regex = new RegExp(`class\\s+${cls.name}\\b`, "g");
              let match;

              while ((match = regex.exec(text)) !== null) {
                let startPos = editor.document.positionAt(match.index);
                let aboveClassPos = new vscode.Position(
                  Math.max(startPos.line - 1, 0),
                  0
                );
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
    } catch (error: any) {
      let errorMessage = "An error occurred while calculating the rates.";
      if (error.response) {

        const errData = error.response.data;

        // Handle server returning plain string
        if (typeof errData === "string") {
          return errData;
        }

        // Handle server returning JSON error object
        if (typeof errData === "object" && errData.message) {
          errorMessage = errData.message;
          if (errData.details) errorMessage += "\n" + errData.details;
          return errorMessage;
        }
        // errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
        errorMessage += ` Server responded with: ${error.response.status}`;

      } else if (error.request) {
        errorMessage += " No response from the server. Is it running?";
      } else {
        errorMessage += ` ${error.message}`;
      }
      return errorMessage;
    }
  }

  async initProject(workspacePath: string): Promise<string> {
    try {
      const response = await fetch("http://localhost:3000/db/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspacePath }),
      });

      const data = await response.json();
      return `Project initialized: ${JSON.stringify(data)}`;
    } catch (err: any) {
      return `Error initializing project: ${err.message}`;
    }
  }

  async refactorSOViolations(
    mainFilePath: string
  ): Promise<{ filePath: string; fileContent: string }[]> {
    console.log("I am in");
    if (!path) return [];

    try {
      const response = await axios.post(
        "http://localhost:3000/refactor/solid",
        {
          path: mainFilePath,
          rootDir: this.workspacePath,
        }
      );
      console.log(response);

      const responseData = response.data.data;
      console.log(responseData);
      this.showRefactorDiffs(responseData);

      return responseData;
    } catch (error: any) {
      let errorMessage = "An error occurred during refactoring.";

      if (error.response) {
        errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
      } else if (error.request) {
        errorMessage += " No response from the server. Is it running?";
      } else {
        errorMessage += ` ${error.message}`;
      }

      return [];
    }
  }

  async showRefactoringSuggestions(): Promise<any> {
    let response;

    try {
      response = await axios.post(
        "http://localhost:3000/refactor/couplingsmells",
        {
          rootDir: this.workspacePath,
        }
      );

      console.log("Response:", response);
      const data = response?.data?.data?.suggestions;
      console.log("Response data:", data);
      return data;
    } catch (error: any) {
      console.error("Error fetching suggestions:", error.message);
      return "Error fetching refactoring suggestions.";
    }
  }

  async undo(mainFilePath: string, projectPath: string): Promise<string> {
    try {
      const response = await axios.post("http://localhost:3000/refactor/undo", {
        path: mainFilePath,
        project: projectPath,
      });

      vscode.window.showInformationMessage("Undo completed for all files.");
      return "Undo completed for all files.";
    } catch (error) {
      vscode.window.showErrorMessage(`Undo failed: ${error}`);
      return `Undo failed: ${error instanceof Error ? error.message : error}`;
    }
  }

  async showRefactorDiffs(
    refactoredFiles: { filePath: string; fileContent: string }[]
  ) {
    if (!providerRegistered) {
      const provider = new RefactorContentProvider();
      vscode.workspace.registerTextDocumentContentProvider(scheme, provider);
      providerRegistered = true;
    }

    let columnIndex = 2;

    for (const { filePath, fileContent: rawNewContent } of refactoredFiles) {
      try {
        const fileUri = vscode.Uri.file(filePath);

        // Read the original file content
        let oldContent: string;
        try {
          const buffer = await vscode.workspace.fs.readFile(fileUri);
          oldContent = buffer.toString();
        } catch (err: any) {
          if (err.code === "FileNotFound" || err.name === "FileNotFound") {
            oldContent = "";
          } else {
            throw err;
          }
        }

        // Step 1: Write raw new content to a temporary file
        const tmpFilePath = path.join(
          os.tmpdir(),
          `refactored-${Date.now()}.java`
        );
        const tmpUri = vscode.Uri.file(tmpFilePath);
        await vscode.workspace.fs.writeFile(
          tmpUri,
          Buffer.from(rawNewContent, "utf8")
        );

        // Step 2: Open & format the temporary file
        const doc = await vscode.workspace.openTextDocument(tmpUri);
        const editor = await vscode.window.showTextDocument(doc, {
          preview: true,
          viewColumn: vscode.ViewColumn.Beside,
        });

        await vscode.commands.executeCommand("editor.action.formatDocument");
        await doc.save();

        // Close the temp editor tab
        await vscode.commands.executeCommand(
          "workbench.action.closeActiveEditor"
        );

        // Step 3: Read back the formatted content
        const formattedBuffer = await vscode.workspace.fs.readFile(tmpUri);
        const formattedContent = formattedBuffer.toString();

        // Optional: delete temp file after reading
        await vscode.workspace.fs.delete(tmpUri);

        // Skip if nothing changed
        if (oldContent === formattedContent) continue;

        // Step 4: Register and show diff
        const originalUri = vscode.Uri.parse(
          `${scheme}://${filePath}.original`
        );
        const refactoredUri = vscode.Uri.parse(
          `${scheme}:${pathToFileURL(filePath).pathname}.refactored`
        );

        contentMap.set(originalUri.toString(), oldContent);
        contentMap.set(refactoredUri.toString(), formattedContent);

        const diffTitle = `Refactor Diff: ${path.basename(filePath)}`;
        const viewColumn =
          columnIndex > 2 ? vscode.ViewColumn.Active : columnIndex;

        await vscode.commands.executeCommand(
          "vscode.diff",
          originalUri,
          refactoredUri,
          diffTitle,
          { viewColumn, preserveFocus: true, preview: false }
        );

        columnIndex++;
      } catch (err) {
        vscode.window.showErrorMessage(
          `Error showing diff for ${filePath}: ${err}`
        );
      }
    }
  }

  async applyAllRefactorings(
    refactoredFiles: { filePath: string; fileContent: string }[]
  ) {
    try {
      for (const { filePath, fileContent } of refactoredFiles) {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(fileContent, "utf8")
        );
      }

      vscode.window.showInformationMessage(
        "All refactorings applied successfully!"
      );
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    } catch (err) {
      vscode.window.showErrorMessage(
        `Failed to apply all refactorings: ${err}`
      );
    }
  }
}
export default InputHandler;
