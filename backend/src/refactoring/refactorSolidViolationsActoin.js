import RefactorAction from "./refactorAction.js";
import getFileWithDependencies from "../fileManager/filePrepare.js";
import project from "../Models/ProjectModel.js";
import { readFile } from "fs/promises";
import path from "path";


class refactorSolidViolationsAction extends RefactorAction {

  async refactorMethod(req) {

    console.log("refactor method-----------------------------------------------------------------------")
    const filePath = req?.body?.path;
    // const projectPath = req?.body?.projectPath;

    // console.log("request",req)
    if (!filePath ) {
      throw new Error("Missing filePath or projectPath in request.");
    }

    let rootDir = filePath;
    while (!rootDir.endsWith(path.join("src", "main", "java"))) {
      rootDir = path.dirname(rootDir);
      if (rootDir === path.dirname(rootDir)) break; // Prevent infinite loop
    }

    const reqData = await getFileWithDependencies(filePath, rootDir);
    // console.log("request data",reqData);
    console.log(reqData.dependencies.length)
    console.log("filePath ",filePath)
    // Read .codeaid-meta.json
    const metaFilePath = await this.findMetadataFile(filePath);
    let metaData;
    try {
      metaData = JSON.parse(await readFile(metaFilePath, "utf-8"));
    } catch (error) {
      throw new Error(
        `Failed to read or parse metadata file at ${metaFilePath}: ${error.message}`
      );
    }

    const projectId = metaData.projectId;
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    // Fetch violations from DB
    const projectDoc = await project.findById(projectId).lean();
    if (!projectDoc) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log("project doc",projectDoc)

    const fileViolations = projectDoc.solidViolations?.find(
      (v) => v.mainFilePath === filePath
    );

    if (!fileViolations || !fileViolations.violations.length) {
      throw new Error(`No SOLID violations found for file ${filePath}`);
    }

    console.log("file violation", fileViolations)
    // ✅ Add violations to reqData (to match the RefactoringRequestData schema)
    reqData.violations = fileViolations.violations;

    console.log("request data for file path",reqData.mainFilePath)
    console.log("request data for file content",reqData.content)

    // ✅ Send API request to refactor endpoint
    const response = await fetch("http://localhost:8000/refactor-solid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqData),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Refactoring result:", result);

    return result;
  }
}

export default refactorSolidViolationsAction;
