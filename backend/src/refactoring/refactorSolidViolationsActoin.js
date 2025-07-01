import RefactorAction from "./refactorAction.js";
import FilePrepare from "../filesManagement/filePrepare.js";
import project from "../Models/ProjectModel.js";
import { readFile } from "fs/promises";
import path from "path";
import dbManager from "../dbManager/dbManager.js";
import ProjectManager from "../filesManagement/projectManager.js";
class refactorSolidViolationsAction extends RefactorAction {

  async refactorMethod(req) {
    const db = new dbManager();
    const fPrepare = new FilePrepare();
    const projectManager = new ProjectManager();
    const filePath = req?.body?.path;
    const rootDir = req?.body?.rootDir;
    if (!filePath) {
      throw new Error("Missing filePath or projectPath in request.");
    }
    await db.setLastState(filePath);
    const projectId = await projectManager.extractProjectId(rootDir);
    console.log("kbgfw;obgoeb:", projectId);
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const reqData = await fPrepare.getFileWithDependenciesChunked(filePath, rootDir, projectId);

    const projectDoc = await db.getProjectDocument(projectId);

    let sentData = {
      data: reqData, 
      violations: projectDoc.solidViolations[0].violations,
    };
    const response = await fetch("http://localhost:8000/refactor-solid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sentData),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    let formattedFiles = await this.codeFormatter.formatJavaWithGoogleFormat(
      result.refactored_files
    );
    return formattedFiles;
  }
}

export default refactorSolidViolationsAction;