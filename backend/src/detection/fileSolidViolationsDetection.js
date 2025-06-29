import getFileWithDependenciesChunked from "./../fileManager/filePrepare.js";
import DetectionAction from "./detectionAction.js";
import RefactorStorage from "../refactoring/refactorStorage.js";

class FileSOLIDViolationDetection extends DetectionAction {
  constructor(fileManager) {
    super(fileManager);
  }

  async detectionMethod(req) {
    const  store = new RefactorStorage();
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("File path for SOLID detection:", filePath);
    console.log("Root directory for Java files:", req?.body?.rootDir);

    // Read projectId from .codeaid-meta.json
    const projectId = await store.extractProjectId(req?.body?.rootDir);


    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    console.log("Extracted projectId:", projectId);

    await store.clearSolidViolationsForProject(projectId);

    const reqData = await getFileWithDependenciesChunked(
      filePath,
      req?.body?.rootDir,
      projectId
    ); // this is the file content with dependencies

    console.log("Request data for SOLID detection:", reqData);

    let dependencies = [];
    for (const dep of reqData) {
      for (const depFile of dep.dependencies) {
        if (depFile.depFilePath) {
          dependencies.push(depFile.depFilePath);
        }
      }
    }

    console.log("Dependencies found:", dependencies);
    console.log("Request data for SOLID detection:", reqData);

    const apiData = reqData;
    console.log("sent");
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
      console.log("received");

      result = await response.json();
      console.log("SOLID Violations:", result);
    } catch (error) {
      console.error("Error calling detect-solid API:", error);
      throw error;
    }

    // result is now properly populated
    const parsed = result;

    console.log("Parsed response:", parsed);
    // const violations = parsed.violations;
    const violations = parsed;

    console.log("Extracted violations:", violations);
    // console.log("violations-------- ", violations[0].violations);
    console.log("DEP before save", dependencies);
    await store.saveSolidViolations(violations, projectId, dependencies);
    console.log("tttttttttttttttttttttttttttttttttttttttttttt")
    return this.extractMainFileViolations(violations);
  }


  extractMainFileViolations(violations){
    let filteredV = []
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
        violatedPrinciples: matchedEntry.violatedPrinciples
      });
    }
    return filteredV;
  }


}

export default FileSOLIDViolationDetection;
