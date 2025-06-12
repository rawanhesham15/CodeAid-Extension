import * as vscode from "vscode";

class ResponseSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ResponseView";
  private _view?: vscode.WebviewView;
  private responses: {
    id: number;
    content: string;
    timestamp: string;
    responseType: string;
  }[] = [];
  private responseCounter: number = 0;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  buildContent(): string {
    if (this.responses.length === 0) {
      return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              background-color: rgb(18, 18, 18);
              color: white;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <h2 style="text-align: center;">CodeAid Responses Panel</h2>
          <p style='text-align: center; color: #919191'>No responses yet, start action to get responses</p>
        </body>
        </html>`;
    }

    const undoEligibleTypes = ["Refactor Result"];
    const refactorEligibleTypes = ["Coupling Smells Detection", "Solid Detection for File"];
    const lastEligibleResponse = this.responses.find((res) =>
      refactorEligibleTypes.includes(res.responseType)
    );

    const responseContent = this.responses
      .map((res) => {
        const showRefactor =
          refactorEligibleTypes.includes(res.responseType) &&
          lastEligibleResponse && lastEligibleResponse.id === res.id;

        const showUndo = undoEligibleTypes.includes(res.responseType);

        return `
        <div id="response-${res.id}" style="
          background-color: rgb(30, 30, 30);
          color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
          margin: 10px 0;
          font-size: 14px;
          align-items: center;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p style="font-size: 17px; font-weight: 500;color: #007f89">${res.responseType}</p>
              <div>
                <i onclick="deleteResponse(${res.id})" style="cursor: pointer;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0,0,256,256">
                    <g fill="#9C9B9B"><g transform="scale(5.12,5.12)">
                      <path d="M7.71875,6.28125l-1.4375,1.4375l17.28125,17.28125l-17.28125,17.28125l1.4375,1.4375l17.28125,-17.28125l17.28125,17.28125l1.4375,-1.4375l-17.28125,-17.28125l17.28125,-17.28125l-1.4375,-1.4375l-17.28125,17.28125z"></path>
                    </g></g>
                  </svg>
                </i>
              </div>    
            </div>
          <div style="margin-top:0px; padding-top:0px">
            <p>${res.content}</p>
            <small style="color: gray;">${res.timestamp}</small>
            ${
              showRefactor
                ? `<button onclick="refactorResponse(${res.id})" style="
                    margin-top: 10px;
                    padding: 5px 10px;
                    background-color: #007f89;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;">Refactor</button>`
                : ""
            }
            ${
              showUndo
                ? `<button onclick="undoResponse(${res.id})" style="
                    margin-top: 10px;
                    margin-left: 10px;
                    padding: 5px 10px;
                    background-color: #007f89;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;">Undo</button>`
                : ""
            }
          </div>   
        </div>`;
      })
      .join("");

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            background-color: rgb(18, 18, 18);
            color: white;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <h2 style="text-align: center;">CodeAid Responses Panel</h2>
        ${responseContent}
        <script>
          const vscode = acquireVsCodeApi();

          function deleteResponse(id) {
            vscode.postMessage({ command: 'deleteResponse', id: id });
          }

          function refactorResponse(id) {
            vscode.postMessage({ command: 'refactorResponse', id: id });
          }

          function undoResponse(id) {
            vscode.postMessage({ command: 'undoResponse', id: id });
          }
        </script>
      </body>
      </html>`;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.buildContent();

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "deleteResponse") {
        this.deleteResponse(message.id);
      } else if (message.command === "refactorResponse") {
        const response = this.responses.find((r) => r.id === message.id);
        if (response) {
          if (response.responseType === "Solid Detection for File") {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage("No active editor found.");
              return;
            }
            const path = editor.document.uri.fsPath;
            const content = editor.document.getText();
            vscode.commands.executeCommand("extension.refactorCode", path, content);
          } else if (response.responseType === "Coupling Smells Detection") {
            vscode.commands.executeCommand("extension.refactorCouplingSmells");
          } else {
            vscode.window.showInformationMessage(`Refactor not applicable for: ${response.responseType}`);
          }
        }
      } else if (message.command === "undoResponse") {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("No active editor found.");
          return;
        }
        const path = editor.document.uri.fsPath;
        vscode.commands.executeCommand("extension.undo", path);
      }
    });
  }

  updateContent(newContent: string, responseType: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.responses.unshift({
      id: this.responseCounter++,
      content: newContent,
      timestamp: timestamp,
      responseType: responseType,
    });

    if (this._view) {
      this._view.webview.html = this.buildContent();
    }
  }

  private deleteResponse(id: number) {
    this.responses = this.responses.filter((res) => res.id !== id);
    if (this._view) {
      this._view.webview.html = this.buildContent();
    }
  }
}

export default ResponseSidebarProvider;
