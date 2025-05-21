import * as vscode from "vscode";
import axios, { get } from "axios";

class InputHandler {
  workspacePath: String;
  constructor() {
    this.workspacePath = this.getWorkSpacePath();
  }

  getWorkSpacePath(): String {
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

  async detectSOLID(context: string): Promise<string> {
    let path: String = "";
    if (context == "project") {
      if (this.workspacePath == "") return "No workspace folder is open";
      path = this.workspacePath;
    } else {
      const result: any = this.getActiveEditorPath();
      if (result == "") return "No active editor found.";
      const filePath: String = result[0];
      const editor: any = result[1];
      const fileContent = editor.document.getText();
      if (!fileContent.trim()) {
        return "The file is empty. Nothing to analyze.";
      }
      path = filePath;
    }

    try {
      const response = await axios.post("http://localhost:3000/detect/solid", {
        path: path,
        context: context,
      });

      const responseData = response.data;
      if (responseData && responseData.message) {
        return responseData.message;
      }
      return "";
    } catch (error: any) {
      let errorMessage = "An error occurred while analyzing.";

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

  async detectCoupling(): Promise<string> {
    if (this.workspacePath == "") return "No workspace folder is open";
    try {
      const response = await axios.post(
        "http://localhost:3000/detect/couplingsmells",
        {
          path: this.workspacePath,
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
      return "";
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
          path: workspaceFolder,
        }
      );

      const responseData = response.data;
      const decorations: vscode.DecorationOptions[] = [];

      complexityDataMap.clear();
      responseData.data.forEach((fileData: any) => {
        complexityDataMap.set(fileData.file, fileData.classes);
      });

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
        errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
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
      const response = await fetch('http://localhost:3000/db/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePath, threshold: 80 }),
      });

      const data = await response.json();
      return `Project initialized: ${JSON.stringify(data)}`;
    } catch (err: any) {
      return `Error initializing project: ${err.message}`;
    }
  }
}
export default InputHandler;
