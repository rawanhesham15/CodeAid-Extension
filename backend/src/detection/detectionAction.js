import FileManager from "./../fileManager/fileManager.js";
import { stat } from "fs/promises";
import path from "path";

class DetectionAction {
  constructor(fileManager) {
    if (new.target === DetectionAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
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
    throw new Error("saveCouplingViolations must be implemented by subclass.");
  }

  async saveViolations(violations, projectId) {
    throw new Error("saveViolations must be implemented by subclass.");
  }

  formatViolationsAsString(violations) {
    throw new Error(
      "formatViolationsAsString must be implemented by subclass."
    );
  }
}

export default DetectionAction;
