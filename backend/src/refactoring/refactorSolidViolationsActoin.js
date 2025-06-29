import RefactorAction from "./refactorAction.js";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";
import project from "../Models/ProjectModel.js";
import { readFile } from "fs/promises";
import path from "path";
import RefactorStorage from "../refactoring/refactorStorage.js";


class refactorSolidViolationsAction extends RefactorAction {

  async refactorMethod(req) {
    const  store = new RefactorStorage();

    const filePath = req?.body?.path;
    const rootDir = req?.body?.rootDir;
    if (!filePath) {
      throw new Error("Missing filePath or projectPath in request.");
    }

    const projectId = await store.extractProjectId(rootDir);
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const reqData = await getFileWithDependenciesChunked(filePath, rootDir, projectId);

    const projectDoc = await project.findById(projectId).lean();
    if (!projectDoc) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

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