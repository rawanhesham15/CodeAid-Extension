import DetectionAction from "./detectionAction.js";
import path from "path";
import FilePrepare from "../filesManagement/filePrepare.js";
import dbManager from "../dbManager/dbManager.js";
import ProjectManager from "../filesManagement/projectManager.js";

class fileCOUPLINGViolationDetection extends DetectionAction {
  constructor(fileManager) {
    super(fileManager);
  }
  async detectionMethod(req) {
    const fPrepare = new FilePrepare();
    const db = new dbManager();
    const projectManager = new ProjectManager();
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    let rootDir = req?.body?.rootDir || path.dirname(filePath);
    const projectId = await projectManager.extractProjectId(rootDir);
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const javaFiles = await this.fileManager.getAllJavaFilePaths(rootDir);
    const { isValid, errorMessage } = await this.fileManager.checkProjectJavaSyntax(
      javaFiles
    );

    if (!isValid) {
      console.error("❌ Java syntax error:\n", errorMessage);
      // return a clean string instead of throwing
      return "Java syntax error in the provided files";
    }

    await db.clearCouplingViolationsForProject(projectId);

    console.log("Extracted projectId:", projectId);
    const reqData = await fPrepare.getFileWithDependenciesChunked(
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
    
    await db.saveCouplingViolations(parsed, projectId);
    return parsed;
  }
}

export default fileCOUPLINGViolationDetection;
