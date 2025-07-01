import FileManager from "../filesManagement/fileManager.js";
import project from "../Models/ProjectModel.js";
import { readFile, stat } from "fs/promises";
import path from "path";
import CodeFormatter from './codeFormatter.js';

class RefactorAction {
    constructor(fileManager) {
        if (new.target === RefactorAction) {
            throw new Error("Can't instantiate an abstract class directly");
        }
        this.fileManager = fileManager || new FileManager();
        this.codeFormatter = new CodeFormatter()
    }

    /**
     * Walks up from a given file or directory path until it finds `.codeaid-meta.json`.
     * @param {string} startPath - The starting file or directory path.
     * @returns {Promise<string>} - Absolute path to `.codeaid-meta.json`.
     * @throws {Error} - If `.codeaid-meta.json` is not found or the path is invalid.
     */

    async refactorMethod(req) {
        throw new Error("refactorMethod must be implemented by subclass.");
    }

}

export default RefactorAction;
