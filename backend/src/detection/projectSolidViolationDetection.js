import DetectionAction from "./detectionAction.js";
import FilePrepare from "../fileManager/filePrepare.js";
import path from "path";
import fileManager from "../fileManager/fileManager.js";
import dbManager from "../dbManager/dbManager.js";
import ProjectManager from "../fileManager/projectManager.js";



class ProjectSOLIDViolationDetection extends DetectionAction {

  // async getAllJavaFilePaths(rootDir) {
  //   try {
  //     const files = await fg("**/*.java", {
  //       cwd: rootDir,
  //       absolute: true,
  //       ignore: ["**/build/**", "**/node_modules/**"],  // "**/out/**"
  //     });
  //     return files;
  //   } catch (error) {
  //     console.error("Error in getAllJavaFilePaths:", error.message);
  //     throw error;
  //   }
  // }

  async detectionMethod(req) {
    const db = new dbManager();
    const fm = new fileManager();
    const projectManager = new ProjectManager();
    const fPrepare = new FilePrepare();

    const projectPath = req?.body?.path;
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
      return "Java syntax error in the provided file";
    }

    let allViolations = [];
    for (const filePath of javaFiles) {
      try {
        const reqData = await fPrepare.getFileWithDependenciesChunked(
          filePath,
          projectPath,
          projectId
        );
        console.log("Request data for SOLID detection:", reqData);

        const normalizedFilePath = path.normalize(filePath);
        const mainChunk = reqData.find(chunk => path.normalize(chunk.mainFilePath) === normalizedFilePath);

        if (!mainChunk) {
          console.warn(`No mainChunk found for ${filePath}`);
          continue; // or handle as needed
        }

        const mainContent = mainChunk.mainFileContent || "";

        // Remove comments and whitespace
        const cleanedContent = mainContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").trim();

        if (cleanedContent === "") {
          console.log(`File is empty (ignoring comments/whitespace): ${filePath}`);
          continue; // Skip API call
        }

        let dependencies = [];
        for (const dep of reqData) {
          for (const depFile of dep.dependencies) {
            if (depFile.depFilePath) {
              dependencies.push(depFile.depFilePath);
            }
          }
        }

        const apiData = reqData;

        console.log("filePath", filePath);
        console.log("dependencies  ", dependencies);

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
          console.log("SOLID Violations:", result);
        } catch (error) {
          console.error("Error calling detect-solid API:", error);
          throw error;
        }

        const violations = result;
        // allViolations.push(...violations);
        allViolations.push(...this.extractMainFileViolations(violations))
        console.log("all violation", allViolations)
      } catch (error) {
        console.error(`Failed for ${filePath}:`, error.message);
        continue;
      }
    }
    return allViolations;
  }


  extractMainFileViolations(violations) {
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

export default ProjectSOLIDViolationDetection;