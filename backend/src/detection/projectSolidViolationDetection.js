import DetectionAction from "./detectionAction.js";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";
import path from "path";
import RefactorStorage from "../refactoring/refactorStorage.js";

class ProjectSOLIDViolationDetection extends DetectionAction {
  // async getAllJavaFiles(rootDir) {
  //   try {
  //     const files = await fg("**/*.java", {
  //       cwd: rootDir,
  //       absolute: true,
  //       ignore: ["**/build/**", "**/node_modules/**"],  // "**/out/**"
  //     });
  //     return files;
  //   } catch (error) {
  //     console.error("Error in getAllJavaFiles:", error.message);
  //     throw error;
  //   }
  // }

  async detectionMethod(req) {
    const store = new RefactorStorage();

    const projectPath = req?.body?.path;
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const projectId = await store.extractProjectId(projectPath);

    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    const javaFiles = await store.getAllJavaFiles(projectPath);
    console.log("Found Java files:", javaFiles);
    let allViolations = [];
    for (const filePath of javaFiles) {
      try {
        const reqData = await getFileWithDependenciesChunked(
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



  formatViolationsAsString(violations) {
    const allowedPrinciples = ["Single Responsibility", "Open-Closed"];

    let result = "";

    for (const violation of violations) {
      const entries = violation.violations || [];

      for (const entry of entries) {
        const filePath = entry.file_path || "unknown";
        const principles = entry.violatedPrinciples || [];

        // Filter allowed principles only
        const filtered = principles.filter((p) =>
          allowedPrinciples.includes(p.principle)
        );

        if (filtered.length === 0) continue;

        result += `File: ${filePath}\n`;
        for (const p of filtered) {
          result += `- Principle: ${p.principle}\n  Justification: ${p.justification}\n`;
        }
        result += `\n`; // separate entries
      }
    }

    console.log("Formatted violations string:\n", result);
    return result.trim(); // remove trailing newline
  }

}

export default ProjectSOLIDViolationDetection;