import LLMController from "../llms/llmController.js";
import FileManager from "./../fileManager/fileManager.js";
import project from "../Models/ProjectModel.js";
import { readFile, stat } from "fs/promises";
import path from "path";

class DetectionAction {
  constructor(llmController, fileManager) {
    if (new.target === DetectionAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
    this.llmController = llmController || new LLMController();
    this.fileManager = fileManager || new FileManager();
  }

  /**
   * Walks up from a given file or directory path until it finds `.codeaid-meta.json`.
   * @param {string} startPath - The starting file or directory path.
   * @returns {Promise<string>} - Absolute path to `.codeaid-meta.json`.
   * @throws {Error} - If `.codeaid-meta.json` is not found or the path is invalid.
   */
  async findMetadataFile(startPath) {
    let currentDir = path.normalize(startPath);

    // Validate the input path and determine if it's a file or directory
    try {
      const stats = await stat(currentDir);
      if (stats.isFile()) {
        currentDir = path.dirname(currentDir);
      }
    } catch (error) {
      throw new Error(
        `Invalid starting path: ${startPath}. Error: ${error.message}`
      );
    }

    // Traverse up the directory tree to find .codeaid-meta.json
    const maxDepth = 10; // Prevent infinite loops
    let depth = 0;
    while (depth < maxDepth) {
      const metaPath = path.join(currentDir, ".codeaid-meta.json");
      try {
        await stat(metaPath); // Check if file exists
        console.log(`Found .codeaid-meta.json at: ${metaPath}`);
        return metaPath;
      } catch (error) {
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          throw new Error(
            `.codeaid-meta.json not found in any parent directories starting from ${startPath}`
          );
        }
        currentDir = parentDir;
        depth++;
      }
    }
    throw new Error(
      `.codeaid-meta.json not found within ${maxDepth} directory levels from ${startPath}`
    );
  }

  async detectionMethod(req) {
    throw new Error("detectionMethod must be implemented by subclass.");
  }

  async saveCouplingViolations(violations, projectId) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    const formatted = violations.flatMap((v) =>
      v.smells.map((smell) => ({
        filePaths: v.filesPaths,
        violation: smell.smell,
        justification: smell.justification,
      }))
    );

    console.log(
      "Formatted coupling violations for saving:",
      JSON.stringify(formatted, null, 2)
    );

    try {
      const updatedProject = await project.findByIdAndUpdate(
        projectId,
        { $set: { couplingViolations: formatted } },
        { new: true }
      );

      if (!updatedProject) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      console.log(
        "Coupling violations saved successfully for project:",
        updatedProject._id
      );
      return updatedProject;
    } catch (error) {
      console.error(
        `Error saving coupling violations for project ${projectId}: ${error.message}`,
        {
          projectId,
          violations,
          stack: error.stack,
        }
      );
      throw error;
    }
  }

  async saveViolations(violations, projectId) {
    throw new Error("saveViolations must be implemented by subclass.");
  }

  gatherCode(path) {
    return this.fileManager.gatherCode(path);
  }

  summarize(path) {
    const code = this.fileManager.gatherCode(path);
    return `Summary of code at ${path}`; // Placeholder implementation
  }

  generatePrompt(codeJSON, summary) {
    throw new Error("generatePrompt must be implemented by subclass.");
  }

  async processPrompt(prompt) {
    return this.llmController.generateResponse(prompt);
  }

  formatViolationsAsString(violations) {
    throw new Error(
      "formatViolationsAsString must be implemented by subclass."
    );
  }

  // formatLLMResponse(response) {
  //   if (typeof response !== 'string') {
  //     return JSON.stringify(response);
  //   }
  //   return response
  //     .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
  //     .replace(/\*(.*?)\*/g, "<i>$1</i>")
  //     .replace(/`(.*?)`/g, "<code>$1</code>")
  //     .replace(/\n/g, "<br>");
  // }
}

export default DetectionAction;
