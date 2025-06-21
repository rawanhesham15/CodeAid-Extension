import FileDetectSOLIDViolationsPG from "../promptGenerator/fileDetectSolidViolationsPG.js";
import getFileWithDependencies from "./../fileManager/filePrepare.js";
import DetectionAction from "./detectionAction.js";
import project from "../Models/ProjectModel.js";
import { readFile, stat } from "fs/promises";
import path from "path";

class FileSOLIDViolationDetection extends DetectionAction {
  constructor(llmController, fileManager) {
    super(llmController, fileManager);
  }
  generatePrompt(codeJSON, summary) {
    let promptGenerator = new FileDetectSOLIDViolationsPG();
    return promptGenerator.generatePrompt(codeJSON.content, summary);
  }

  async detectionMethod(req) {
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    // Go up until src/main/java
    let rootDir = filePath;
    while (!rootDir.endsWith(path.join("src", "main", "java"))) {
      rootDir = path.dirname(rootDir);
      if (rootDir === path.dirname(rootDir)) break; // Prevent infinite loop
    }


   
    const reqData = await getFileWithDependencies(
      filePath,
      rootDir
    ); // this is the file content with dependencies

    let dependencies = [];
    for(const dep of reqData.dependencies) {
      dependencies.push(dep.depFilePath);
    }
    console.log("Dependencies found:", dependencies);
    // console.log("Request data for SOLID detection:", reqData);

    const apiData = [reqData];
    
    fetch("http://localhost:8000/detect-solid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiData)
    })
      .then(async response => {
        if (!response.ok) throw new Error("Network response was not ok");
        const result = await response.json(); // 👈 result is saved here
        console.log("Result:", result);
        return result;
      })
      .then(data => {
        console.log("SOLID Violations:", data);
      })
      .catch(error => {
        console.error("Error calling API:", error);
      });


    // const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    // const violations = parsed.violations;


    const dummyResponse = `[{
      "violations": [
        {
          "file_path": "sorting/SortGolfers.java",
          "violatedPrinciples": [
            {
              "principle": "Single Responsibility",
              "justification": "The class handles multiple responsibilities: managing golfer data, implementing various sorting algorithms, and outputting results. These should be separated into distinct classes."
            },
            {
              "principle": "Open-Closed",
              "justification": "Adding new sorting criteria requires modifying the class. It should be extensible through abstractions like Comparator."
            },
            {
              "principle": "Dependency Inversion",
              "justification": "The high-level sorting logic directly depends on the concrete Golfer class. It should depend on abstractions."
            }
          ]
        }
      ]
    }]`;

    let parsed;
    try {
      parsed = JSON.parse(dummyResponse);
    } catch (error) {
      console.error("Failed to parse JSON:", error.message);
      throw error;
    }

    console.log("Parsed response:", parsed);

    const violations = parsed[0].violations;
    console.log("Extracted violations:", violations);

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

    await this.saveViolations(violations, projectId, dependencies);
    return this.formatViolationsAsString(violations);
    // return this.formatLLMResponse(JSON.stringify(parsed));
  }

  async saveViolations(violations, projectId, dependencies) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    if (!Array.isArray(violations) || violations.length === 0) {
      throw new Error("No violations to save.");
    }

    const mainFile = violations[0];

    const formatted = {
      mainFilePath: mainFile.file_path,
      dependenciesFilePaths: dependencies,
      violations: mainFile.violatedPrinciples.map((p) => ({
        principle: p.principle,
        justification: p.justification,
      })),
    };

    console.log(
      "Formatted SOLID violations for saving:",
      JSON.stringify(formatted, null, 2)
    );

    try {
      const updatedProject = await project.findByIdAndUpdate(
        projectId,
        { $set: { solidViolations: [formatted] } }, // wrap in array
        { new: true }
      );

      if (!updatedProject) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      console.log("Updated project successfully:", updatedProject._id);
    } catch (error) {
      console.error(
        `Error saving violations for project ${projectId}: ${error.message}`,
        {
          projectId,
          violations,
          stack: error.stack,
        }
      );
      throw error;
    }
  }

  formatViolationsAsString(violations) {
    return violations
      .map((v) => {
        const header = `File: ${v.file_path}`;
        const details = v.violatedPrinciples
          .map(
            (p) =>
              `- Principle: ${p.principle}\n  Justification: ${p.justification}`
          )
          .join("\n");
        return `${header}\n${details}`;
      })
      .join("\n\n");
  }
}

export default FileSOLIDViolationDetection;
