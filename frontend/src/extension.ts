import * as vscode from "vscode";

import { MyTreeDataProvider } from "./UI/commandsPanel";
const axios = require("axios");

export function activate(context: vscode.ExtensionContext) {
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

  const myTreeDataProvider = new MyTreeDataProvider();

  vscode.window.registerTreeDataProvider("myView", myTreeDataProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.refreshTree", () => {
      myTreeDataProvider.refresh();
    })
  );
  context.subscriptions.push(analyzeProjectCommand);
  context.subscriptions.push(analyzeFileCommand);
  context.subscriptions.push(plotClassDiagramCommand);
  context.subscriptions.push(plotArchitectureDiagramCommand);
  context.subscriptions.push(plotDepDiagramCommand);
  context.subscriptions.push(displayRateCommand);
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
