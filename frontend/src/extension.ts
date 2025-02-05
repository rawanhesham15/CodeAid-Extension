import * as vscode from "vscode";
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  console.log("CodeAid Extension is now active!");

  const analyzeProjectCommand = vscode.commands.registerCommand(
    "extension.analyzeProject",
    analyzeProject
  );
  const analyzeFileCommand = vscode.commands.registerCommand(
    "extension.analyzeFile",
    analyzeFile
  );
  const plotClassDiagramCommand = vscode.commands.registerCommand(
    "extension.plotClassDiagram",
    plotClassDiagram
  );
  const plotArchitectureDiagramCommand = vscode.commands.registerCommand(
    "extension.plotArchitectureDiagram",
    plotArchitectureDiagram
  );
  const plotDepDiagramCommand = vscode.commands.registerCommand(
    "extension.plotDependencyDiagram",
    plotDependencyDiagram
  );
  const displayRateCommand = vscode.commands.registerCommand(
    "extension.displayRate",
    displayRate
  );

  context.subscriptions.push(
    analyzeProjectCommand,
    analyzeFileCommand,
    plotClassDiagramCommand,
    plotArchitectureDiagramCommand,
    plotDepDiagramCommand,
    displayRateCommand
  );

  const provider = new CodeAidSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CodeAidSidebarProvider.viewType, provider)
  );
}

export function deactivate() {}

async function analyzeProject(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:3000/detect/solid", {
      path: workspaceFolder,
      context: "project",
    });

    const responseData = response.data;

    if (responseData && responseData.message) {
      vscode.window.showInformationMessage(
        `Analysis Result: ${responseData.message}`
      );
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while analyzing the file.";

    if (error.response) {
      errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
    } else if (error.request) {
      errorMessage += " No response from the server. Is it running?";
    } else {
      errorMessage += ` ${error.message}`;
    }

    vscode.window.showErrorMessage(errorMessage);
  }
}
async function analyzeFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }

  const filePath = editor.document.uri.fsPath;

  const fileContent = editor.document.getText();
  if (!fileContent.trim()) {
    vscode.window.showWarningMessage("The file is empty. Nothing to analyze.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:3000/detect/solid", {
      path: filePath,
      context: "file",
    });

    const responseData = response.data;

    if (responseData && responseData.message) {
      vscode.window.showInformationMessage(
        `Analysis Result: ${responseData.message}`
      );
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while analyzing the file.";

    if (error.response) {
      errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
    } else if (error.request) {
      errorMessage += " No response from the server. Is it running?";
    } else {
      errorMessage += ` ${error.message}`;
    }

    vscode.window.showErrorMessage(errorMessage);
  }
}
async function plotClassDiagram(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:3000/plot/class", {
      path: workspaceFolder,
    });

    const responseData = response.data;
    if (responseData && responseData.path) {
      vscode.window.showInformationMessage(
        `Class diagram generated at  ${responseData.path}`
      );
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while generating the diagram.";

    if (error.response) {
      errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
    } else if (error.request) {
      errorMessage += " No response from the server. Is it running?";
    } else {
      errorMessage += ` ${error.message}`;
    }

    vscode.window.showErrorMessage(errorMessage);
  }
}
async function plotArchitectureDiagram(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:3000/plot/architecture",
      {
        path: workspaceFolder,
      }
    );

    const responseData = response.data;
    if (responseData && responseData.path) {
      vscode.window.showInformationMessage(
        `Architecture diagram generated at  ${responseData.path}`
      );
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while generating the diagram.";

    if (error.response) {
      errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
    } else if (error.request) {
      errorMessage += " No response from the server. Is it running?";
    } else {
      errorMessage += ` ${error.message}`;
    }

    vscode.window.showErrorMessage(errorMessage);
  }
}
async function plotDependencyDiagram(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:3000/plot/dependency", {
      path: workspaceFolder,
    });

    const responseData = response.data;
    if (responseData && responseData.path) {
      vscode.window.showInformationMessage(
        `Dependency diagram generated at  ${responseData.path}`
      );
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while generating the diagram.";

    if (error.response) {
      errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
    } else if (error.request) {
      errorMessage += " No response from the server. Is it running?";
    } else {
      errorMessage += ` ${error.message}`;
    }

    vscode.window.showErrorMessage(errorMessage);
  }
}
async function displayRate(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:3000/rateCalc/complexity",
      {
        path: workspaceFolder,
      }
    );

    const responseData = response.data;
    if (responseData) {
      vscode.window.showInformationMessage(`Complexity rates are generated`);
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while calculating the rates.";

    if (error.response) {
      errorMessage += ` Server responded with: ${error.response.status} - ${error.response.data}`;
    } else if (error.request) {
      errorMessage += " No response from the server. Is it running?";
    } else {
      errorMessage += ` ${error.message}`;
    }

    vscode.window.showErrorMessage(errorMessage);
  }
}
class CodeAidSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "codeAidView";
  
    constructor(private readonly _extensionUri: vscode.Uri) {}
  
    resolveWebviewView(webviewView: vscode.WebviewView) {
      webviewView.webview.options = {
          enableScripts: true,
      };
  
      webviewView.webview.html = this._getHtmlForWebview(webviewView);
  
      webviewView.webview.onDidReceiveMessage((message) => {
          switch (message.command) {
              case "detectSolid":
                  if (message.context === "detectSolidFile") {
                      vscode.commands.executeCommand("extension.analyzeFile");
                  } else if (message.context === "detectSolidProject") {
                      vscode.commands.executeCommand("extension.analyzeProject");
                  }
                  break;
              case "detectCoupling":
                  if (message.context === "detectCouplingFile") {
                      vscode.commands.executeCommand("extension.analyzeFile");
                  } else if (message.context === "detectCouplingProject") {
                      vscode.commands.executeCommand("extension.analyzeProject");
                  }
                  break;
              case "plotDiagrams":
                  message.selectedDiagrams.forEach((diagram: string) => {
                      switch (diagram) {
                          case "Dependency":
                              vscode.commands.executeCommand("extension.plotDependencyDiagram");
                              break;
                          case "Class":
                              vscode.commands.executeCommand("extension.plotClassDiagram");
                              break;
                          case "Architecture":
                              vscode.commands.executeCommand("extension.plotArchitectureDiagram");
                              break;
                      }
                  });
                  break;
              case "displayRate":
                  vscode.commands.executeCommand("extension.displayRate");
                  break;
          }
      });
  }
  
  
    private _getHtmlForWebview(webviewView: vscode.WebviewView): string {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeAid</title>
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src ${webviewView.webview.cspSource};">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                    background-color: #282c34;
                    color: #e1e1e6;
                }
                h2 {
                    color: #e1e1e6;
                }
                h3 {
                    color: #e1e1e6;
                    margin-top: 20px;
                }
                .section {
                    margin-bottom: 15px;
                }
                label {
                    margin-right: 10px;
                    color: #e1e1e6;
                }
                button {
                    background-color: #007acc;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    border-radius: 4px;
                    margin-top: 5px;
                }
                button:hover {
                    background-color: #005fa3;
                }
                #result {
                    margin-top: 10px;
                    font-weight: bold;
                }
                .btn-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .radio-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 10px;
                }
                .radio-label {
                    color: #e1e1e6;
                }
                .checkbox-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
            </style>
        </head>
        <body>
            <h2>CodeAid Features</h2>
  
            <div class="section">
                <h3> SOLID Detection</h3>
                <div class="radio-container">
                    <label class="radio-label">
                        <input type="radio" name="solidContext" id="detectSolidFile" checked />
                        Current File
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="solidContext" id="detectSolidProject" />
                        Whole Project
                    </label>
                </div>
                <button id="detectSolid">
                    Detect SOLID
                </button>
            </div>
  
            <div class="section">
                <h3> Coupling smeels Detection </h3>
                <div class="radio-container">
                    <label class="radio-label">
                        <input type="radio" name="couplingContext" id="detectCouplingFile" checked />
                        Current File
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="couplingContext" id="detectCouplingProject" />
                        Whole Project
                    </label>
                </div>
                <button id="detectCoupling">
                    Detect Coupling
                </button>
            </div>
  
            <div class="section">
                <h3>Plot Diagrams</h3>
                <div class="checkbox-container">
                    <label>
                        <input type="checkbox" id="plotDependency" />
                        Dependency Diagram
                    </label>
                    <label>
                        <input type="checkbox" id="plotClass" />
                        Class Diagram
                    </label>
                    <label>
                        <input type="checkbox" id="plotArchitecture" />
                        Architecture Diagram
                    </label>
                </div>
                <button id="plotDiagrams">
                    Plot Selected Diagrams
                </button>
            </div>
  
            <div class="section">
                <h3>Display Complexity Rate</h3>
                <button id="displayRateBtn">
                    Display Rate
                </button>
            </div>
  
            <script>
                const vscode = acquireVsCodeApi();
  
                document.getElementById("detectSolid").addEventListener("click", () => {
                    const context = document.querySelector('input[name="solidContext"]:checked').id;
                    vscode.postMessage({ command: "detectSolid", context });
                });
  
                document.getElementById("detectCoupling").addEventListener("click", () => {
                    const context = document.querySelector('input[name="couplingContext"]:checked').id;
                    vscode.postMessage({ command: "detectCoupling", context });
                });
  
                document.getElementById("plotDiagrams").addEventListener("click", () => {
                    const selectedDiagrams = [];
                    if (document.getElementById("plotDependency").checked) {
                        selectedDiagrams.push("Dependency");
                    }
                    if (document.getElementById("plotClass").checked) {
                        selectedDiagrams.push("Class");
                    }
                    if (document.getElementById("plotArchitecture").checked) {
                        selectedDiagrams.push("Architecture");
                    }
                    vscode.postMessage({ command: "plotDiagrams", selectedDiagrams });
                });
  
                document.getElementById("displayRateBtn").addEventListener("click", () => {
                    vscode.postMessage({ command: "displayRate" });
                });
  
                window.addEventListener("message", (event) => {
                    const message = event.data;
                    document.getElementById("result").innerText = message.text;
                });
            </script>
        </body>
        </html>
      `;
    }
  }
  