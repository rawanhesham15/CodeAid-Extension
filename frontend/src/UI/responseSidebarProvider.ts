import * as vscode from "vscode";

class ResponseSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ResponseView";
  private _view?: vscode.WebviewView;
  private responses: {
    id: number;
    content: string;
    timestamp: string;
    responseType: string;
    refactorState?: "show" | "apply" | "undo";
    buttonDisabled?: boolean;
    suggestionsVisible?: boolean;
  }[] = [];
  private responseCounter: number = 0;
  private isLoading: boolean = false;
  private loadingMessage: string = "";

  constructor(private readonly _extensionUri: vscode.Uri) {}

  private updateWebview() {
    if (this._view) {
      this._view.webview.html = this.buildContent();
    }
  }

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

    const buttonLabel = {
      show: "Show Refactored Code",
      apply: "Apply Refactoring",
      undo: "Undo Refactoring",
    };

    const lastEligibleMap: Record<string, number> = {};
    for (const res of this.responses) {
      if (
        res.responseType === "Solid Detection for File" &&
        !(res.responseType in lastEligibleMap)
      ) {
        lastEligibleMap[res.responseType] = res.id;
      }
      if (
        res.responseType === "Coupling Smells Detection for File" &&
        !(res.responseType in lastEligibleMap)
      ) {
        lastEligibleMap[res.responseType] = res.id;
      }
    }

    const responseContent = this.responses
      .map((res) => {
        const showRefactor =
          res.responseType === "Solid Detection for File" &&
          lastEligibleMap[res.responseType] === res.id;

        let buttonHtml = "";

        if (
          res.responseType === "Solid Detection for File" &&
          showRefactor &&
          res.refactorState
        ) {
          buttonHtml = `<button onclick="handleRefactor('${res.id}')"
                style="cursor: ${
                  res.buttonDisabled || this.isLoading
                    ? "not-allowed"
                    : "pointer"
                };"
                ${res.buttonDisabled || this.isLoading ? "disabled" : ""}>
                ${buttonLabel[res.refactorState]}
              </button>`;
        } else if (
          res.responseType === "Coupling Smells Detection for File" &&
          !res.suggestionsVisible &&
          lastEligibleMap[res.responseType] === res.id
        ) {
          buttonHtml = `<button onclick="handleSuggestion('${res.id}')"
                style="cursor: pointer;">
                Show Suggested Refactorings
              </button>`;
        }

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
              <p style="font-size: 17px; font-weight: 500;color: #178cad">${res.responseType}</p>
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
            <div style="display: flex;justify-content: space-between;">
              <small style="color: gray;">${res.timestamp}</small>
              ${buttonHtml}
            </div>
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
          button {
            font-family: "Outfit", serif;
            background-color: #178cad;
            color: white;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            margin-top: 5px;
            transition: 0.5s;
          }
          button:hover:enabled {
            background-color: transparent;
            border: 1px solid #178cad;
            color: #178cad;
            transition: 0.5s;
          }
        </style>
      </head>
      <body>
        <h2 style="text-align: center;">CodeAid Responses Panel</h2>
        ${responseContent}

        ${
          this.isLoading
            ? `
          <div id="loading-overlay" style="
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
            font-weight: bold;">
            ${this.loadingMessage}
          </div>`
            : ""
        }

        <script>
          const vscode = acquireVsCodeApi();

          function deleteResponse(id) {
            vscode.postMessage({ command: 'deleteResponse', id: id });
          }

          function handleRefactor(id) {
            vscode.postMessage({ command: 'handleRefactor', id: parseInt(id) });
          }

          function handleSuggestion(id) {
            vscode.postMessage({ command: 'handleSuggestion', id: parseInt(id) });
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

    this.updateWebview();

    webviewView.webview.onDidReceiveMessage((message: any) => {
      if (message.command === "deleteResponse") {
        this.deleteResponse(message.id);
      } else if (message.command === "handleRefactor") {
        const res = this.responses.find((r) => r.id === message.id);
        if (!res) return;

        this.isLoading = true;

        if (res.refactorState === "show") {
          this.loadingMessage = "Preparing refactored files...";
          this.updateWebview();

          vscode.commands
            .executeCommand("extension.handleRefactorRequest")
            .then(() => {
              res.refactorState = "apply";
              this.responses.forEach((r) => {
                if (r.responseType === res.responseType) {
                  r.buttonDisabled = r.id !== res.id;
                }
              });
              this.isLoading = false;
              this.updateWebview();
            });
        } else if (res.refactorState === "apply") {
          this.loadingMessage = "Applying refactoring...";
          this.updateWebview();

          vscode.commands
            .executeCommand("extension.applyRefactoring")
            .then(() => {
              res.refactorState = "undo";
              this.isLoading = false;
              this.updateWebview();
            });
        } else if (res.refactorState === "undo") {
          this.loadingMessage = "Undoing changes...";
          this.updateWebview();

          vscode.commands.executeCommand("extension.undo").then(() => {
            res.refactorState = undefined;
            this.isLoading = false;
            this.updateWebview();
          });
        }
      } else if (message.command === "handleSuggestion") {
        const res = this.responses.find((r) => r.id === message.id);
        if (!res) return;
        vscode.commands
          .executeCommand("extension.showRefactoringSuggestions")
          .then(() => {
            res.suggestionsVisible = true;
            this.isLoading = false;
            this.updateWebview();
          });
      }
    });
  }

  updateContent(newContent: string, responseType: string) {
    const timestamp = new Date().toLocaleTimeString();
    const ignoredMessages = [
      "No workspace folder is open",
      "No active editor found.",
      "The file is empty. Nothing to analyze.",
      "No design flaws found.",
    ];

    const hasValidContent = !ignoredMessages.includes(newContent.trim());

    this.responses.unshift({
      id: this.responseCounter++,
      content: newContent,
      timestamp,
      responseType,
      refactorState:
        responseType === "Solid Detection for File" && hasValidContent
          ? "show"
          : undefined,
      buttonDisabled: false,
      suggestionsVisible: false,
    });

    this.updateWebview();
  }

  private deleteResponse(id: number) {
    this.responses = this.responses.filter((res) => res.id !== id);
    this.updateWebview();
  }
}

export default ResponseSidebarProvider;
