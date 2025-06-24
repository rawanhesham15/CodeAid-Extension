import RefactorAction from "./refactorAction.js";
import FileRefactorCouplingPG from "../promptGenerator/fileRefactorCouplingPG.js";
import getFileWithDependencies from "../fileManager/filePrepare.js";

class FileRefactorCoupling extends RefactorAction {
  generatePrompt(codeJSON, summary) {
    const codeString = codeJSON.map(f => f.content).join("\n");
    const generator = new FileRefactorCouplingPG();
    return generator.generatePrompt(codeString, summary);
  }

  async refactorMethod(req) {
    const filePath = req?.body?.filePath;
    const projectPath = req?.body?.projectPath;

    if (!filePath || !projectPath) {
      throw new Error("Missing filePath or projectPath in request.");
    }

    const reqData = await getFileWithDependencies(filePath, projectPath);
    const codeJSON = [reqData];

    const summarizedCode = `Refactor file ${filePath} to reduce coupling.`;
    const prompt = this.generatePrompt(codeJSON, summarizedCode);
    const response = await this.processPrompt(prompt);

    return response;
  }
}

export default FileRefactorCoupling;
