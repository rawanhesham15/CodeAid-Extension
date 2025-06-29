import DetectionAction from "./detectionAction.js";
import path from "path";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";
import FileManager from "../fileManager/fileManager.js";
import dbManager from "../dbManager/dbManager.js";

class ProjectCOUPLINGViolationDetection extends DetectionAction {
  // async getAllJavaFiles(rootDir) {
  //   return await fg("**/*.java", {
  //     cwd: rootDir,
  //     absolute: true,
  //     ignore: ["**/build/**", "**/node_modules/**"],  // "**/out/**"
  //   });
  // }

  async detectionMethod(req) {
    const db = new dbManager();
    const fm = new FileManager();
    const projectPath = req?.body?.path;
    console.log(projectPath)
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const projectId = await db.extractProjectId(projectPath);

    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }


    const javaFiles = await fm.getAllJavaFiles(projectPath);
    console.log("Found Java files:", javaFiles);
    let allViolations = [];
    for (const filePath of javaFiles) {
      try {
        const reqData = await getFileWithDependenciesChunked(filePath, projectPath, projectId);
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

        const apiData = reqData;

        console.log("filePath", filePath);
        // console.log("dependencies  ", dependencies);


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

export default ProjectCOUPLINGViolationDetection;
