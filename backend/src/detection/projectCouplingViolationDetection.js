import DetectionAction from "./detectionAction.js";
import path from "path";
import FilePrepare from "../filesManagement/filePrepare.js";
import FileManager from "../filesManagement/fileManager.js";
import dbManager from "../dbManager/dbManager.js";
import ProjectManager from "../filesManagement/projectManager.js";
class ProjectCOUPLINGViolationDetection extends DetectionAction {
  async detectionMethod(req) {
    const db = new dbManager();
    const fm = new FileManager();
    const fPrepare = new FilePrepare();
    const projectManager = new ProjectManager();
    const projectPath = req?.body?.path;
    console.log(projectPath);
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const projectId = await projectManager.extractProjectId(projectPath);

    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const javaFiles = await fm.getAllJavaFilePaths(projectPath);
    console.log("Found Java files:", javaFiles);

    const { isValid, errorMessage } = await fm.checkProjectJavaSyntax(
      javaFiles
    );

    if (!isValid) {
      console.error("❌ Java syntax error:\n", errorMessage);
      // return a clean string instead of throwing
      return "Java syntax error in the provided files";
    }

    let allViolations = [];
    for (const filePath of javaFiles) {
      try {
        const reqData = await fPrepare.getFileWithDependenciesChunked(
          filePath,
          projectPath,
          projectId
        );
        const normalizedFilePath = path.normalize(filePath);
        const mainChunk = reqData.find(
          (chunk) => path.normalize(chunk.mainFilePath) === normalizedFilePath
        );

        if (!mainChunk) {
          console.warn(`No mainChunk found for ${filePath}`);
          continue; // or handle as needed
        }

        const mainContent = mainChunk.mainFileContent || "";

        // Remove comments and whitespace
        const cleanedContent = mainContent
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")
          .trim();

        if (cleanedContent === "") {
          console.log(
            `File is empty (ignoring comments/whitespace): ${filePath}`
          );
          continue; // Skip API call
        }

        const apiData = reqData;

        let result;
        try {
          const response = await fetch(
            "http://localhost:8000/detect-coupling",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(apiData),
            }
          );

          if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
          }

          result = await response.json();
          console.log("Coupling Violations:", result);

          let parsed = result;
          console.log("parsed ", parsed);
          allViolations.push(...parsed);
        } catch (error) {
          console.error("Error calling detect-solid API:", error);
          throw error;
        }
      } catch (error) {
        console.error(`Failed for ${filePath}:`, error.message);
        continue;
      }
    }
    return allViolations;
  }
}

export default ProjectCOUPLINGViolationDetection;
