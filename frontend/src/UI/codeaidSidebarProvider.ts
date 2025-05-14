import * as vscode from "vscode";

class CodeAidSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codeAidView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "detectSolid":
          vscode.commands.executeCommand(
            "extension.detectSOLID",
            message.context
          );
          break;
        case "detectCoupling":
          vscode.commands.executeCommand("extension.detectCoupling");
          break;
        case "plotDiagram":
          vscode.commands.executeCommand(
            "extension.plotDiagram",
            message.diagram
          );
          break;
        case "displayRate":
          vscode.commands.executeCommand("extension.displayRate");
          break;
      }
    });
  }

  private _getHtmlForWebview(): string {
    const webview = this._view?.webview;
    const imageUri = webview?.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sc.png")
    );
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>CodeAid</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
            href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
            rel="stylesheet"
            />
            <style>
            body {
                font-family: "Outfit", serif;
                padding: 10px;
                background-color: rgb(18, 18, 18);
                color: #e1e1e6;
                width: 295px;
            }
            .header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                margin-left: 15px;
                font-size: 20px;
                font-weight: bold;
            }
            h3 {
                color: #e1e1e6;
            }
            .section {
                margin-bottom: 15px;
                margin-left: 35px;
            
            }
            label {
                margin-right: 10px;
                color: #e1e1e6;
            }
            button {
                font-family: "Outfit", serif;
                background-color: #007f89;
                color: white;
                border: none;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 4px;
                margin-top: 5px;
                transition: 0.5s;
                width:80px;
            }
            button:hover {
                background-color: transparent;
                border: 1px solid #007f89;
                color: #007f89;
                transition: 0.5s;
            }
            #result {
                margin-top: 10px;
                font-weight: bold;
            }
            .btn-container {
                display: flex;
                justify-content: end;
            }
            .flex-wrapper {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .custom-select {
                position: relative;
            }
            .custom-select select {
                font-family: "Outfit", sans-serif;
                box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
                appearance: none;
                width: 130px;
                font-size: 15px;
                padding: 7px 10px;
                background-color: #fff;
                border: 1px solid #393939;
                border-radius: 0.25rem;
                color: #000;
                cursor: pointer;
                background-color: #000;
                color: #fff;
            }
            .custom-select::before,
            .custom-select::after {
                --size: 0.3rem;
                position: absolute;
                content: "";
                right: 1rem;
                pointer-events: none;
            }

            .custom-select::before {
                border-left: var(--size) solid transparent;
                border-right: var(--size) solid transparent;
                border-bottom: var(--size) solid whitesmoke;
                top: 28%;
                margin-top: 2px;
            }

            .custom-select::after {
                border-left: var(--size) solid transparent;
                border-right: var(--size) solid transparent;
                border-top: var(--size) solid whitesmoke;
                top: 55%;
            }
            </style>
        </head>
        <body>
            <div class="header">
            <img src="${imageUri}" width="28" />
            <p style="line-height: 28px">&nbsp;&nbsp;CodeAid</p>
            </div>
            <div class="section">
            <div class="flex-wrapper">
                <h3>SOLID Detection</h3>
                <div class="custom-select">
                <select id="solidSelect">
                    <option value="project">Project</option>
                    <option value="file">File</option>
                </select>
                </div>
            </div>
            <div class="btn-container">
                <button id="detectSolid">Detect</button>
            </div>
            </div>

            <div class="section">
            <h3>Coupling smells Detection</h3>
            <div class="btn-container">
                <button id="detectCoupling">Detect</button>
            </div>
            </div>

            <div class="section">
            <div class="flex-wrapper">
                <h3>Plot Diagrams</h3>
                <div class="custom-select">
                <select id="diagramSelect">
                    <option value="class">Class</option>
                    <option value="dependency">Dependency</option>
                    <option value="component">Component</option>
                </select>
                </div>
            </div>
            <div class="btn-container">
                <button id="plotDiagram">Plot</button>
            </div>
            </div>

            <div class="section">
            <h3>Display Complexity Rate</h3>
            <div class="btn-container">
                <button id="displayRateBtn">Display</button>
            </div>
            </div>

            <script>
            const vscode = acquireVsCodeApi();

            document.getElementById("detectSolid").addEventListener("click", () => {
                const solidContext = document.getElementById("solidSelect").value; // Get selected value from dropdown
                vscode.postMessage({ command: "detectSolid", context: solidContext });
            });

            document
                .getElementById("detectCoupling")
                .addEventListener("click", () => {
                vscode.postMessage({ command: "detectCoupling" });
                });

            document.getElementById("plotDiagram").addEventListener("click", () => {
                const diagram = document.getElementById("diagramSelect").value;
                vscode.postMessage({
                command: "plotDiagram",
                diagram: diagram,
                });
            });

            document
                .getElementById("displayRateBtn")
                .addEventListener("click", () => {
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

export default CodeAidSidebarProvider;
