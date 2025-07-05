import FilePrepare from "../filesManagement/filePrepare.js";
import DetectionAction from "./detectionAction.js";
import dbManager from "../dbManager/dbManager.js";
import ProjectManager from "../filesManagement/projectManager.js";
class FileSOLIDViolationDetection extends DetectionAction {
  constructor(fileManager) {
    super(fileManager);
  }

  async detectionMethod(req) {
    const db = new dbManager();
    const fPrepare = new FilePrepare();
    const projectManager = new ProjectManager();
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("File path for SOLID detection:", filePath);
    console.log("Root directory for Java files:", req?.body?.rootDir);

    // Read projectId from .codeaid-meta.json
    const projectId = await projectManager.extractProjectId(req?.body?.rootDir);

    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    console.log("Extracted projectId:", projectId);

    const javaFiles = await this.fileManager.getAllJavaFilePaths(
      req?.body?.rootDir
    );
    console.log("jF", javaFiles);
    const { isValid, errorMessage } =
      await this.fileManager.checkProjectJavaSyntax(javaFiles);

    if (!isValid) {
      console.error("❌ Java syntax error:\n", errorMessage);
      // return a clean string instead of throwing
      return "Java syntax error in the provided files";
    }

    await db.clearSolidViolationsForProject(projectId);

    const reqData = await fPrepare.getFileWithDependenciesChunked(
      filePath,
      req?.body?.rootDir,
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
      const response = await fetch("http://localhost:8000/detect-solid", {
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
    } catch (error) {
      console.error("Error calling detect-solid API:", error);
      throw error;
    }

    // result is now properly populated
    const parsed = result;

    console.log("Parsed response:", parsed);
    const violations = parsed;

    console.log("Extracted violations:", violations);
    await db.saveSolidViolations(violations, projectId, dependencies);
    return this.extractMainFileViolations(violations);
  }

  extractMainFileViolations(violations) {
    let filteredV = [];
    for (const v of violations) {
      const mainFilePath = v.mainFilePath || "unknown";
      const entries = v.violations || [];

      const matchedEntry = entries.find(
        (entry) => entry.file_path === mainFilePath
      );
      if (!matchedEntry) {
        console.warn(
          `No violation entry found for main file path: ${mainFilePath}`
        );
        continue;
      }
      if (matchedEntry.violatedPrinciples.length === 0) {
        continue;
      }

      filteredV.push({
        file_path: mainFilePath,
        violatedPrinciples: matchedEntry.violatedPrinciples,
      });
    }
    return filteredV;
  }
}

export default FileSOLIDViolationDetection;
