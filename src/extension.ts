// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
const { GoogleGenerativeAI } = require("@google/generative-ai");


function getUserCode(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return null;
    }
    return editor.document.getText();
}

async function sendCodeToModel(code: string): Promise<any> {
	const genAI = new GoogleGenerativeAI("AIzaSyC-bBVVstUGkTLEW_PE5pvs-nSJiOtvuho");
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
	const prompt = `in only 100 words Detect if there is any SOLID principle violation in this code ${code}`;

    try {
		const result = await model.generateContent(prompt);
		console.log(result.data);
        return result.response.text();
    } catch (error) {
        vscode.window.showErrorMessage('Failed to connect to the model API.');
        console.error(error);
    }
}

function displayViolations(violations: String): void {
	if(violations){
		vscode.window.showWarningMessage(
			`Violations detected: ${violations}`
		);
	}
}

async function analyzeCode(): Promise<void> {
    const code = getUserCode();
    if (!code) return;

    const analysis = await sendCodeToModel(code);
	displayViolations(analysis);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// // Use the console to output diagnostic information (console.log) and errors (console.error)
	// // This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "codeaid" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand('codeaid.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World VSC!');
	// });

	// context.subscriptions.push(disposable);

	const analyzeCommand = vscode.commands.registerCommand('extension.analyzeCode', analyzeCode);
    context.subscriptions.push(analyzeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
