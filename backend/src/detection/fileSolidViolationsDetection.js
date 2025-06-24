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
    // Go up until src/main/java
    // while (!rootDir.endsWith(path.join("src", "main", "java"))) {
    //   rootDir = path.dirname(rootDir);
    //   if (rootDir === path.dirname(rootDir)) break; // Prevent infinite loop
    // }
    console.log("Root directory for Java files:",req?.body?.rootDir);
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
    
    let result;
    try {
      const response = await fetch("http://localhost:8000/detect-solid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
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

    // result is now properly populated
    const parsed = result;

    console.log("Parsed response:", parsed);
    // const violations = parsed.violations;
    const violations = parsed;

    console.log("Extracted violations:", violations);
    console.log("DEP before save", dependencies);
    await this.saveViolations(violations, projectId, dependencies);
    return this.formatViolationsAsString(violations);

    // return this.formatLLMResponse(JSON.stringify(parsed));
  }

  // async saveViolations(violations, projectId, dependencies) {
  //   if (!projectId || typeof projectId !== "string") {
  //     throw new Error("Invalid project ID");
  //   }

  //   if (!Array.isArray(violations) || violations.length === 0) {
  //     throw new Error("No violations to save.");
  //   }

  //   const allowedPrinciples = ["Single Responsibility", "Open-Closed"];
  //   const mainFile = violations[0];

  //   // Filter principles to include only the allowed ones
  //   const filteredPrinciples = mainFile.violatedPrinciples.filter((p) =>
  //     allowedPrinciples.includes(p.principle)
  //   );

  //   if (filteredPrinciples.length === 0) {
  //     console.log("No SRP or OCP violations found. Skipping save.");
  //     return;
  //   }

  //   const formatted = {
  //     mainFilePath: mainFile.file_path,
  //     dependenciesFilePaths: dependencies,
  //     violations: filteredPrinciples.map((p) => ({
  //       principle: p.principle,
  //       justification: p.justification,
  //     })),
  //   };

  //   console.log(
  //     "Filtered SOLID violations to save:",
  //     JSON.stringify(formatted, null, 2)
  //   );

  //   try {
  //     const updatedProject = await project.findByIdAndUpdate(
  //       projectId,
  //       { $set: { solidViolations: [formatted] } }, // you may use $push instead if you want to accumulate
  //       { new: true }
  //     );

  //     if (!updatedProject) {
  //       throw new Error(`Project with ID ${projectId} not found`);
  //     }

  //     console.log("Updated project successfully:", updatedProject._id);
  //   } catch (error) {
  //     console.error(
  //       `Error saving violations for project ${projectId}: ${error.message}`,
  //       {
  //         projectId,
  //         violations,
  //         stack: error.stack,
  //       }
  //     );
  //     throw error;
  //   }
  // }


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
    const filePath = v.mainFilePath || "unknown";
    const filteredPrinciples = (v.violations || []).filter(p =>
      allowedPrinciples.includes(p.principle)
    );

    formattedViolations.push({
      mainFilePath: filePath,
      dependenciesFilePaths: dependencies,
      violations: filteredPrinciples.map((p) => ({
        principle: p.principle,
        justification: p.justification,
      })),
    });
  }
  try {
    // Get existing project with violations
    const projectDoc = await project.findById(projectId).lean();
    if (!projectDoc) throw new Error(`Project with ID ${projectId} not found`);

    const existingViolations = projectDoc.solidViolations || [];
    console.log("Existing violations:", JSON.stringify(existingViolations, null, 2));
    // Merge by mainFilePath
    for (const newEntry of formattedViolations) {
      const existingIndex = existingViolations.findIndex(
        (v) => v.mainFilePath === newEntry.mainFilePath
      );

      if (existingIndex !== -1) {
        // Merge violations (append new ones if not duplicate)
        const existing = existingViolations[existingIndex];
        const existingPrinciples = new Set(
          existing.violations.map((v) => v.principle)
        );

        for (const newV of newEntry.violations) {
          if (!existingPrinciples.has(newV.principle)) {
            existing.violations.push(newV);
          }
        }

        // Optionally update dependencies if needed
        // existing.dependenciesFilePaths = [...new Set([...existing.dependenciesFilePaths, ...newEntry.dependenciesFilePaths])];
      } else {
        // Add new entry
        existingViolations.push(newEntry);
      }
    }

    // Save merged result
    const updated = await project.findByIdAndUpdate(
      projectId,
      { $set: { solidViolations: existingViolations } },
      { new: true }
    );

    console.log("Saved merged violations:", JSON.stringify(existingViolations, null, 2));
    if (!updated) {
      throw new Error("Failed to update project document");
    }
  } catch (error) {
    console.error("Error saving violations:", error.message);
    throw error;
  }
}



  formatViolationsAsString(violations) {
    let x =  violations
      .map((v) => {
        const header = `File: ${v.mainFilePath}`;
        const details = v.violations
          .map(
            (p) =>
              `- Principle: ${p.principle}\n  Justification: ${p.justification}`
          )
          .join("\n");
          
        return `${header}\n${details}`;
      })
      .join("\n\n");
      console.log("tessssssssssssssst",x);
      return x;
  }
  
}

export default FileSOLIDViolationDetection;
//Extracted JSON part: [{'file_path': 'c:\\Users\\marwa\\Downloads\\ToffeeStore\\category.java', 'violatedPrinciples': [{'principle': 'Single Responsibility', 'justification': 'The category class handles both data management (storing items) and presentation logic (displayCategoryItem method). These are two distinct responsibilities that should be separated into different classes.'}, {'principle': 'Dependency Inversion', 'justification': 'The displayCategoryItem method directly depends on concrete item objects. High-level modules should depend on abstractions (interfaces) rather than concrete implementations to decouple dependencies.'}]}]