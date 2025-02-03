"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const generative_ai_1 = require("@google/generative-ai");
const commandsPanel_1 = require("./UI/commandsPanel");
const axios = require("axios");
const apiKey = "AIzaSyBV7jCQG0bTndlhcHGkPy-8Ev1nRWhFFz0";
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
function activate(context) {
    const myTreeDataProvider = new commandsPanel_1.MyTreeDataProvider();
    // Register the tree view
    vscode.window.createTreeView('extension.myView', {
        treeDataProvider: myTreeDataProvider
    });
    context.subscriptions.push(vscode.commands.registerCommand('myExtension.refreshTree', () => {
        myTreeDataProvider.refresh();
    }));
    //  // Access root items synchronously
    //  const rootItems = myTreeDataProvider.getRootItems();
    //  const firstRootItem = rootItems[0]; 
    //  myTreeDataProvider.selectRootItem(firstRootItem);
    vscode.window.registerTreeDataProvider("myView", myTreeDataProvider);
}
function deactivate() { }
// function getAllJavaFiles(dir: string): string[] {
//   let javaFiles: string[] = [];
//   const files = fs.readdirSync(dir);
//   for (const file of files) {
//     const fullPath = path.join(dir, file);
//     if (fs.statSync(fullPath).isDirectory()) {
//       javaFiles = javaFiles.concat(getAllJavaFiles(fullPath));
//     } else if (file.endsWith(".java")) {
//       javaFiles.push(fullPath);
//     }
//   }
//   return javaFiles;
// }
// function extractImports(filePath: string): string[] {
//   const content = fs.readFileSync(filePath, "utf-8");
//   const importLines = content.match(/^import\s+([\w.]+);/gm) || [];
//   return importLines.map((line) => line.replace(/^import\s+|;$/g, "").trim());
// }
// function buildClusters(files: string[]): Set<Set<string>> {
//   const dependencyGraph = new Map<string, Set<string>>();
//   const filePathMap = new Map<string, string>();
//   files.forEach((file) => {
//     const baseName = path.basename(file, ".java");
//     filePathMap.set(baseName, file);
//   });
//   for (const file of files) {
//     const imports = extractImports(file);
//     const fileName = path.basename(file, ".java");
//     if (!dependencyGraph.has(fileName)) {
//       dependencyGraph.set(fileName, new Set());
//     }
//     imports.forEach((imported) => {
//       const importedFileName = imported.split(".").pop();
//       if (filePathMap.has(importedFileName!)) {
//         dependencyGraph.get(fileName)?.add(importedFileName!);
//       }
//     });
//   }
//   const clusters: Set<Set<string>> = new Set();
//   for (const [file, dependencies] of dependencyGraph.entries()) {
//     const cluster = new Set<string>();
//     cluster.add(filePathMap.get(file)!);
//     dependencies.forEach((dep) => cluster.add(filePathMap.get(dep)!));
//     clusters.add(cluster);
//   }
//   return clusters;
// }
// async function sendClustersToModel(clusters: Set<Set<string>>): Promise<void> {
//   let responses = "";
//   for (const cluster of clusters) {
//     const combinedCode = Array.from(cluster)
//       .map((file) => fs.readFileSync(file, "utf-8"))
//       .join("\n");
//     const prompt = `Analyze the following Java code and identify violations of the SOLID principles. For each violation, provide:
// 1. The principle violated.
// 2. The specific part of the code responsible.
// 3. A brief explanation of why the violation occurs:\n\n${combinedCode}`;
//     try {
//       const result = await model.generateContent(prompt);
//       responses += result.response.text() + "\n";
//     } catch (error) {
//       vscode.window.showErrorMessage(`Failed to analyze.`);
//       console.error("Model API error:", error);
//     }
//   }
//   const finalPrompt = `Given the following responses, provide a summarized response that contain each principle and in front of it the classes that violated that principle\n${responses}`;
//   try {
//     const finalResult = await model.generateContent(finalPrompt);
//     const summary = finalResult.response.text();
//     const doc = new PDFDocument();
//     const pdfPath = path.join(
//       vscode.workspace.workspaceFolders![0].uri.fsPath,
//       "Final_Analysis.pdf"
//     );
//     const pdfStream = fs.createWriteStream(pdfPath);
//     doc.pipe(pdfStream);
//     doc.fontSize(16).text("Final Analysis Summary", { underline: true });
//     doc.fontSize(12).text(summary);
//     doc.end();
//     pdfStream.on("finish", () => {
//       vscode.window.showInformationMessage(`Analysis saved to PDF: ${pdfPath}`);
//     });
//   } catch (error) {
//     vscode.window.showErrorMessage("Failed to generate final analysis.");
//     console.error("Model API error:", error);
//   }
// }
// async function analyzeProject(): Promise<void> {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     vscode.window.showErrorMessage("No workspace folder found.");
//     return;
//   }
//   const projectDir = workspaceFolders[0].uri.fsPath;
//   const javaFiles = getAllJavaFiles(projectDir);
//   if (javaFiles.length === 0) {
//     vscode.window.showErrorMessage("No Java files found in the project.");
//     return;
//   }
//   const clusters = buildClusters(javaFiles);
//   await sendClustersToModel(clusters);
// }
// async function analyzeFile(): Promise<void> {
//   const editor = vscode.window.activeTextEditor;
//   if (!editor) {
//     vscode.window.showErrorMessage("No active editor found.");
//     return;
//   }
//   const code = editor.document.getText();
//   const prompt = `in only 100 words Detect if there is any SOLID principle violation in this code ${code}`;
//   try {
//     const result = await model.generateContent(prompt);
//     const violations = result.response.text();
//     vscode.window.showWarningMessage(`Violations detected: ${violations}`);
//   } catch (error) {
//     vscode.window.showErrorMessage("Failed to connect to the model API.");
//     console.error(error);
//   }
// }
// async function plotClassDiagram(): Promise<void> {
//   const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
//   if (!workspaceFolder) {
//     vscode.window.showErrorMessage("No workspace folder is open.");
//     return;
//   }
//   try {
//     const response = await axios.post(
//       "http://localhost:3000/plot/class",
//       {
//         projectPath: workspaceFolder,
//       }
//     );
//     const outputPath = response.data.filePath;
//     vscode.window.showInformationMessage(`Diagram saved at: ${outputPath}`);
//   } catch (error) {
//     vscode.window.showErrorMessage(
//       `Error generating diagram`
//     );
//   }
// }
// async function plotC4Diagram(): Promise<void> {
//   const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
//   if (!workspaceFolder) {
//     vscode.window.showErrorMessage("No workspace folder is open.");
//     return;
//   }
//   const outputPath = path.join(workspaceFolder, "C4_diagram.png");
//   const diagramDefinition: string = `
//     C4Context
//       title System Context diagram for Internet Banking System
//       Enterprise_Boundary(b0, "BankBoundary0") {
//         Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
//         Person(customerB, "Banking Customer B")
//         Person_Ext(customerC, "Banking Customer C", "desc")
//         Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")
//         System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")
//         Enterprise_Boundary(b1, "BankBoundary") {
//           SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")
//           System_Boundary(b2, "BankBoundary2") {
//             System(SystemA, "Banking System A")
//             System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")
//           }
//           System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
//           SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")
//           Boundary(b3, "BankBoundary3", "boundary") {
//             SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")
//             SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
//           }
//         }
//       }
//       BiRel(customerA, SystemAA, "Uses")
//       BiRel(SystemAA, SystemE, "Uses")
//       Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
//       Rel(SystemC, customerA, "Sends e-mails to")
//       UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
//       UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
//       UpdateRelStyle(SystemAA, SystemE, $textColor="blue", $lineColor="blue", $offsetY="-10")
//       UpdateRelStyle(SystemAA, SystemC, $textColor="blue", $lineColor="blue", $offsetY="-40", $offsetX="-50")
//       UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")
//       UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
// `;
//   const diagramStream = new PassThrough();
//   diagramStream.end(Buffer.from(diagramDefinition, "utf-8"));
//   const command = `npx mmdc -o "${outputPath}"`;
//   const child = exec(command, (error, stdout, stderr) => {
//     if (error) {
//       vscode.window.showErrorMessage(
//         "Error generating diagram: " + error.message
//       );
//       console.error(stderr);
//       return;
//     }
//     vscode.window.showInformationMessage(`Diagram saved at: ${outputPath}`);
//   });
//   diagramStream.pipe(child.stdin!);
// }
// async function plotDependencyDiagram(): Promise<void> {
//   const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
//   if (!workspaceFolder) {
//     vscode.window.showErrorMessage("No workspace folder is open.");
//     return;
//   }
//   const outputPath = path.join(workspaceFolder, "dependency_diagram.png");
//   const diagramDefinition: string = `
// graph TD
//     A[UserService] --> B[AuthService]
//     B --> C[DatabaseService]
//     A --> C
// `;
//   const diagramStream = new PassThrough();
//   diagramStream.end(Buffer.from(diagramDefinition, "utf-8"));
//   const command = `npx mmdc -o "${outputPath}"`;
//   const child = exec(command, (error, stdout, stderr) => {
//     if (error) {
//       vscode.window.showErrorMessage(
//         "Error generating diagram: " + error.message
//       );
//       console.error(stderr);
//       return;
//     }
//     vscode.window.showInformationMessage(`Diagram saved at: ${outputPath}`);
//   });
//   diagramStream.pipe(child.stdin!);
// }
// class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
//   private _onDidChangeTreeData: vscode.EventEmitter<
//     vscode.TreeItem | undefined | null | void
//   > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
//   readonly onDidChangeTreeData: vscode.Event<
//     vscode.TreeItem | undefined | null | void
//   > = this._onDidChangeTreeData.event;
//   getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
//     return element;
//   }
//   getChildren(
//     element?: vscode.TreeItem
//   ): vscode.TreeItem[] | Thenable<vscode.TreeItem[]> {
//     if (!element) {
//       return [
//         this.createButton("Analyze the project", "extension.analyzeProject"),
//         this.createButton("Analyze current file", "extension.analyzeFile"),
//         this.createButton("Plot Class Diagram", "extension.plotClassDiagram"),
//         this.createButton("Plot C4 Diagram", "extension.plotC4Diagram"),
//         this.createButton(
//           "Plot Dependency Diagram",
//           "extension.plotDependencyDiagram"
//         ),
//       ];
//     }
//     return [];
//   }
//   private createButton(label: string, command: string): vscode.TreeItem {
//     const treeItem = new vscode.TreeItem(label);
//     treeItem.command = {
//       command: command,
//       title: label,
//     };
//     treeItem.tooltip = `Click to execute ${label}`;
//     treeItem.iconPath = new vscode.ThemeIcon("debug-start");
//     return treeItem;
//   }
// }
//# sourceMappingURL=extension.js.map