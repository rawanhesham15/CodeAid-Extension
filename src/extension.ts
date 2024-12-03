import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyC-bBVVstUGkTLEW_PE5pvs-nSJiOtvuho";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function getAllJavaFiles(dir: string): string[] {
  let javaFiles: string[] = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      javaFiles = javaFiles.concat(getAllJavaFiles(fullPath));
    } else if (file.endsWith(".java")) {
      javaFiles.push(fullPath);
    }
  }
  return javaFiles;
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const importLines = content.match(/^import\s+([\w.]+);/gm) || [];
  return importLines.map((line) => line.replace(/^import\s+|;$/g, "").trim());
}

function buildClusters(files: string[]): Set<Set<string>> {
  const dependencyGraph = new Map<string, Set<string>>();
  const filePathMap = new Map<string, string>();

  files.forEach((file) => {
    const baseName = path.basename(file, ".java");
    filePathMap.set(baseName, file);
  });

  for (const file of files) {
    const imports = extractImports(file);
    const fileName = path.basename(file, ".java");
    if (!dependencyGraph.has(fileName)) {
      dependencyGraph.set(fileName, new Set());
    }
    imports.forEach((imported) => {
      const importedFileName = imported.split(".").pop();
      if (filePathMap.has(importedFileName!)) {
        dependencyGraph.get(fileName)?.add(importedFileName!);
      }
    });
  }
	const clusters: Set<Set<string>> = new Set();

  for (const [file, dependencies] of dependencyGraph.entries()) {
    const cluster = new Set<string>();
    cluster.add(filePathMap.get(file)!);
    dependencies.forEach((dep) => cluster.add(filePathMap.get(dep)!));
    clusters.add(cluster);
  }
  return clusters;
}

async function sendClustersToModel(clusters: Set<Set<string>>): Promise<void> {
  let responses = "";

  for (const cluster of clusters) {
    const combinedCode = Array.from(cluster)
      .map((file) => fs.readFileSync(file, "utf-8"))
      .join("\n");
    const prompt = `Analyze the following Java code and identify violations of the SOLID principles. For each violation, provide:
1. The principle violated.
2. The specific part of the code responsible.
3. A brief explanation of why the violation occurs:\n\n${combinedCode}`;

    try {
      const result = await model.generateContent(prompt);
      responses += result.response.text() + "\n";
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to analyze.`);
      console.error("Model API error:", error);
    }
  }

  const finalPrompt = `Given the following responses, provide a summarized response that contain each principle and in front of it the classes that violated that principle\n${responses}`;
  try {
    const finalResult = await model.generateContent(finalPrompt);
    const summary = finalResult.response.text();
    const doc = new PDFDocument();
    const pdfPath = path.join(
      vscode.workspace.workspaceFolders![0].uri.fsPath,
      "Final_Analysis.pdf"
    );
    const pdfStream = fs.createWriteStream(pdfPath);

    doc.pipe(pdfStream);
    doc.fontSize(16).text("Final Analysis Summary", { underline: true });
    doc.fontSize(12).text(summary);
    doc.end();
    pdfStream.on("finish", () => {
      vscode.window.showInformationMessage(`Analysis saved to PDF: ${pdfPath}`);
    });
  } catch (error) {
    vscode.window.showErrorMessage("Failed to generate final analysis.");
    console.error("Model API error:", error);
  }
}

async function analyzeProject(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder found.");
    return;
  }
  const projectDir = workspaceFolders[0].uri.fsPath;
  const javaFiles = getAllJavaFiles(projectDir);
  if (javaFiles.length === 0) {
    vscode.window.showErrorMessage("No Java files found in the project.");
    return;
  }
  const clusters = buildClusters(javaFiles);
  await sendClustersToModel(clusters);
}

async function analyzeFile(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }
  const code = editor.document.getText();
  const prompt = `in only 100 words Detect if there is any SOLID principle violation in this code ${code}`;
  try {
    const result = await model.generateContent(prompt);
    const violations = result.response.text();
		vscode.window.showWarningMessage(`Violations detected: ${violations}`);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to connect to the model API.");
    console.error(error);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const analyzeProjectCommand = vscode.commands.registerCommand(
    "extension.analyzeProject",
    analyzeProject
  );
  const analyzeFileCommand = vscode.commands.registerCommand(
    "extension.analyzeFile",
    analyzeFile
  );
  context.subscriptions.push(analyzeProjectCommand);
	context.subscriptions.push(analyzeFileCommand);
}

export function deactivate() {}