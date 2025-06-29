import FileManager from "../fileManager/fileManager.js";
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
    async findMetadataFile(startPath) {
        let currentDir = path.normalize(startPath);

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

        const maxDepth = 10;
        let depth = 0;
        while (depth < maxDepth) {
            const metaPath = path.join(currentDir, ".codeaid-meta.json");
            try {
                await stat(metaPath);
                console.log(`Found .codeaid-meta.json at: ${metaPath}`);
                return metaPath;
            } catch (error) {
                const parentDir = path.dirname(currentDir);
                if (parentDir === currentDir) {
                    throw new Error(
                        `.codeaid-meta.json not found starting from ${startPath}`
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

    async refactorMethod(req) {
        throw new Error("refactorMethod must be implemented by subclass.");
    }

}

export default RefactorAction;
