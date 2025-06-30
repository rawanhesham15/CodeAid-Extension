import DetectionAction from "./detectionAction.js";
import path from "path";
import getFileWithDependenciesChunked from "./../fileManager/filePrepare.js";
import dbManager from "../dbManager/dbManager.js";



class fileCOUPLINGViolationDetection extends DetectionAction {
  constructor(fileManager) {
    super(fileManager);
  }
  async detectionMethod(req) {
    const db = new dbManager
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", filePath);

    let rootDir = req?.body?.rootDir || path.dirname(filePath);
    const projectId = await db.extractProjectId(rootDir);
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const javaFiles = await this.fileManager.getAllJavaFiles(rootDir);
    const { isValid, errorMessage } = await this.fileManager.checkProjectJavaSyntax(
      javaFiles
    );

    if (!isValid) {
      console.error("❌ Java syntax error:\n", errorMessage);
      // return a clean string instead of throwing
      return "Java syntax error in the provided file";
    }


    await db.clearCouplingViolationsForProject(projectId);

    console.log("Extracted projectId:", projectId);
    const reqData = await getFileWithDependenciesChunked(
      filePath,
      rootDir,
      projectId
    ); // this is the file content with dependencies

    let dependencies = [];
    for (const dep of reqData) {
      for (const depFile of dep.dependencies) {
        if (depFile.depFilePath) {
          dependencies.push(depFile.depFilePath);
        }
      }
    }

    console.log("Dependencies found:", dependencies);
    // console.log("Request data for SOLID detection:", reqData);

    const apiData = reqData;

    let result;
    try {
      const response = await fetch("http://localhost:8000/detect-coupling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });


      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      result = await response.json();
      console.log("Coupling Violations:", result);
    } catch (error) {
      console.error("Error calling detect-solid API:", error);
      throw error;
    }

    let parsed = result;
    console.log("parsed ", parsed);
    await db.saveCouplingViolations(parsed, projectId);
    return parsed;
  }


  formatViolationsAsString(parsed) {
    let allFormattedViolations = [];

    for (const entry of parsed) {
      // const mainFilePaths = entry.filesPaths || [];
      const couplingSmells = entry.couplingSmells || [];

      for (const smellGroup of couplingSmells) {
        const smellFilePaths = smellGroup.filesPaths || [];
        const smells = smellGroup.smells || [];

        for (const smellObj of smells) {
          const { smell, justification } = smellObj;

          allFormattedViolations.push(
            // `Main File(s): ${mainFilePaths.join(", ")}\n` +
            `Affected File(s): ${smellFilePaths.join(", ")}\n` +
            `Smell: ${smell}\n` +
            `Justification: ${justification}`
          );
        }
      }
    }

    return allFormattedViolations.join("\n---\n");
  }

}

export default fileCOUPLINGViolationDetection;
