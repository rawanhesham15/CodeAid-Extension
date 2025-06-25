import DetectionAction from "./detectionAction.js";
import project from "../Models/ProjectModel.js";
import { readFile, stat } from "fs/promises";
import fg from "fast-glob";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";

class ProjectSOLIDViolationDetection extends DetectionAction {
  async getAllJavaFiles(rootDir) {
    try {
      const files = await fg("**/*.java", {
        cwd: rootDir,
        absolute: true,
        ignore: ["**/build/**", "**/node_modules/**"],
      });
      return files;
    } catch (error) {
      console.error("Error in getAllJavaFiles:", error.message);
      throw error;
    }
  }

  async detectionMethod(req) {
    const projectPath = req?.body?.path;
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const metaFilePath = await this.findMetadataFile(projectPath);

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

    await this.clearViolationsForProject(projectId);

    const javaFiles = await this.getAllJavaFiles(projectPath);
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

        let dependencies = [];
        let res = "";
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
        allViolations.push(...violations);

        await this.saveViolations(violations, projectId, dependencies);
      } catch (error) {
        console.error(`Failed for ${filePath}:`, error.message);
        continue;
      }
    }
    return this.formatViolationsAsString(allViolations);
  }

  async saveViolations(violations, projectId, dependencies) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    if (!Array.isArray(violations)) {
      throw new Error("Violations must be an array.");
    }

    const allowedPrinciples = ["Single Responsibility", "Open-Closed"];
    const formattedViolations = [];

    for (const v of violations) {
      const mainFilePath = v.mainFilePath || "unknown";
      const entries = v.violations || [];

      // Only extract the violation entry that matches the main file
      const matchedEntry = entries.find(
        (entry) => entry.file_path === mainFilePath
      );

      if (!matchedEntry) {
        console.warn(`No matching violation found for: ${mainFilePath}`);
        continue;
      }

      const filteredPrinciples = (matchedEntry.violatedPrinciples || []).filter(
        (p) => allowedPrinciples.includes(p.principle)
      );

      if (filteredPrinciples.length === 0) continue;

      formattedViolations.push({
        mainFilePath,
        dependenciesFilePaths: dependencies,
        violations: filteredPrinciples.map((p) => ({
          principle: p.principle,
          justification: p.justification,
        })),
      });
    }

    try {
      const projectDoc = await project.findById(projectId).lean();
      if (!projectDoc) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const existingViolations = projectDoc.solidViolations || [];
      console.log(
        "Existing violations:",
        JSON.stringify(existingViolations, null, 2)
      );

      // Merge logic
      for (const newEntry of formattedViolations) {
        const existingIndex = existingViolations.findIndex(
          (v) => v.mainFilePath === newEntry.mainFilePath
        );

        if (existingIndex !== -1) {
          const existing = existingViolations[existingIndex];
          const existingPrinciples = new Set(
            existing.violations.map((v) => v.principle)
          );

          for (const newV of newEntry.violations) {
            if (!existingPrinciples.has(newV.principle)) {
              existing.violations.push(newV);
            }
          }
        } else {
          existingViolations.push(newEntry);
        }
      }

      const updated = await project.findByIdAndUpdate(
        projectId,
        { $set: { solidViolations: existingViolations } },
        { new: true }
      );

      console.log(
        "Saved merged violations:",
        JSON.stringify(existingViolations, null, 2)
      );

      if (!updated) {
        throw new Error("Failed to update project document");
      }
    } catch (error) {
      console.error("Error saving violations:", error.message);
      throw error;
    }
  }

  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { solidViolations: [] } }
    );
  }

  // formatViolationsAsString(violations) {
  //   return violations
  //     .filter((v) => v && v.mainFilePath && Array.isArray(v.violations))
  //     .map((v) => {
  //       const header = `File: ${v.mainFilePath}`;
  //       const details = v.violations
  //         .map(
  //           (p) =>
  //             `- Principle: ${p.principle}\n  Justification: ${p.justification}`
  //         )
  //         .join("\n");

  //       return `${header}\n${details}`;
  //     })
  //     .join("\n\n");
  // }

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