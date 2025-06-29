import RefactorAction from "./refactorAction.js";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";
import path from "path";
import project from "../Models/ProjectModel.js";
import { readFile } from "fs/promises";
import fetch from "node-fetch"; // if using Node.js without native fetch
import dbManager from "../dbManager/dbManager.js";
class FileRefactorCoupling extends RefactorAction {
  /**
   * Builds an object compatible with the Python class `couplingSuggestionIn`
   * @param {Array} couplingViolations - Array of detected violations
   * @returns {Promise<{coupling_smells: Array}>}
   */
  async buildCouplingSuggestionInFormat(couplingViolations) {
    const result = {  
      coupling_smells: [],
    };

    for (const violation of couplingViolations) {
      const filePromises = violation.FilePaths.map(this.getFileContent);
      const fileContents = await Promise.all(filePromises);

      const validFiles = fileContents
        .filter(f => f !== null)
        .map(f => ({
          filePath: f.filePath,
          content: f.content,
        }));

      const smells = violation.couplingSmells.map(smell => ({
        smell: smell.smell,
        justification: smell.justification,
      }));

      result.coupling_smells.push({
        files: validFiles,
        smells: smells,
      });
    }

    return result;
  }

  /**
   * Reads file content and returns normalized filePath + content
   */
  async getFileContent(filePath) {
    try {
      const content = await readFile(filePath, "utf8");
      return {
        filePath: path.normalize(filePath),
        content: content,
      };
    } catch (error) {
      console.error(`Failed to read ${filePath}:`, error.message);
      return null;
    }
  }

  async refactorMethod(req) {
    const db = new dbManager();
   // const filePath = req?.body?.filePath;
    const rootDir = req?.body?.rootDir;

    if ( !rootDir) {
      throw new Error("Missing filePath or projectPath in request.");
    }
    const projectId = await db.extractProjectId(rootDir);
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const projectDoc = await db.getProjectDocument(projectId);


    console.log("project doc", projectDoc);

    const inputData = await this.buildCouplingSuggestionInFormat(
      projectDoc.couplingViolations || []
    );
    console.log("Input data for refactoring:", inputData);
    const sentData = {
      ...inputData,
    };

    const response = await fetch("http://localhost:8000/refactor-coupling", {
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
    return result;
  }
}

export default FileRefactorCoupling;
