import FileDetectSOLIDViolationsPG from "../promptGenerator/fileDetectSolidViolationsPG.js";
import getFileWithDependenciesChunked from "./../fileManager/filePrepare.js";
import DetectionAction from "./detectionAction.js";
import project from "../Models/ProjectModel.js";
import { readFile, stat } from "fs/promises";
import path from "path";

class FileSOLIDViolationDetection extends DetectionAction {
  constructor(fileManager) {
    super(fileManager);
  }

  async detectionMethod(req) {
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("File path for SOLID detection:", filePath);
    console.log("Root directory for Java files:", req?.body?.rootDir);

    // Read projectId from .codeaid-meta.json
    const metaFilePath = await this.findMetadataFile(filePath);

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

    console.log("Extracted projectId:", projectId);

    this.clearViolationsForProject(projectId);

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
    await this.saveViolations(violations, projectId, dependencies);
    return violations;
  }

  getAllowedPrinciples() {
    return ["Single Responsibility", "Open-Closed"];
  }

  async saveViolations(violations, projectId, dependencies) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    if (!Array.isArray(violations)) {
      throw new Error("Violations must be an array.");
    }

    const allowedPrinciples = this.getAllowedPrinciples();
    const formattedViolations = [];

    for (const v of violations) {
      const mainFilePath = v.mainFilePath || "unknown";
      const entries = v.violations || [];

      // Find the entry that matches the main file
      const matchedEntry = entries.find(
        (entry) => entry.file_path === mainFilePath
      );
      if (!matchedEntry) {
        console.warn(
          `No violation entry found for main file path: ${mainFilePath}`
        );
        continue;
      }

      const filteredPrinciples = (matchedEntry.violatedPrinciples || []).filter(
        (p) => allowedPrinciples.includes(p.principle)
      );

      if (filteredPrinciples.length === 0) {
        continue; // Skip if no allowed principles found
      }

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
      if (!projectDoc)
        throw new Error(`Project with ID ${projectId} not found`);

      const existingViolations = projectDoc.solidViolations || [];

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
      if (!updated) throw new Error("Failed to update project document");
    } catch (error) {
      console.error("Error saving violations:", error.message);
      throw error;
    }
  }

  formatViolationsAsString(violations) {
    // const allowedPrinciples = ["Single Responsibility", "Open-Closed"];
    const allowedPrinciples = this.getAllowedPrinciples();

    let result = "";

    for (const violation of violations) {
      const entries = violation.violations || [];

      // for (const entry of entries) {
      const filePath = entries[0].file_path || "unknown";
      const principles = entries[0].violatedPrinciples || [];

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
      // }
    }

    console.log("Formatted violations string:\n", result);
    return result.trim(); // remove trailing newline
  }

  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { solidViolations: [] } }
    );
  }
}

export default FileSOLIDViolationDetection;
//Extracted JSON part: [{'file_path': 'c:\\Users\\marwa\\Downloads\\ToffeeStore\\category.java', 'violatedPrinciples': [{'principle': 'Single Responsibility', 'justification': 'The category class handles both data management (storing items) and presentation logic (displayCategoryItem method). These are two distinct responsibilities that should be separated into different classes.'}, {'principle': 'Dependency Inversion', 'justification': 'The displayCategoryItem method directly depends on concrete item objects. High-level modules should depend on abstractions (interfaces) rather than concrete implementations to decouple dependencies.'}]}]
