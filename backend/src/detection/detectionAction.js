import FileManager from "./../filesManagement/fileManager.js";

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

  async detectionMethod(req) {
    throw new Error("detectionMethod must be implemented by subclass.");
  }


}

export default DetectionAction;
