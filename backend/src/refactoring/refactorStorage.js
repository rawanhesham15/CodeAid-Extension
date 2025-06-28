import fs from "fs/promises";
import path from "path";
import { stat } from "fs/promises";
import project from "../Models/ProjectModel.js";

class RefactorStorage {
  constructor() {}

  // Locate .codeaid-meta.json and extract the projectId
  async extractProjectId(startPath) {
    const metaPath = await this.findMetaPath(startPath);
    const metaContent = await fs.readFile(metaPath, "utf-8");
    const metaData = JSON.parse(metaContent);
    const projectId = metaData.projectId;

    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    console.log("Extracted projectId:", projectId);
    return projectId;
  }

  // Find the path of the .codeaid-meta.json file
  async findMetaPath(startPath) {
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
        await stat(metaPath); // file exists
        return metaPath;
      } catch (error) {
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
        depth++;
      }
    }

    throw new Error(
      `.codeaid-meta.json not found within ${maxDepth} levels from ${startPath}`
    );
  }

  // Merge file states, keeping the latest version per filePath
  mergeLastState(existing, incoming) {
    const fileMap = new Map();

    for (const entry of existing) {
      fileMap.set(path.normalize(entry.filePath), entry);
    }

    for (const entry of incoming) {
      fileMap.set(path.normalize(entry.filePath), entry); // Overwrite or insert
    }

    return Array.from(fileMap.values());
  }

  // Save {filePath, content} to the lastState of the corresponding project
  async save(filePath, content) {
    try {
      const projectId = await this.extractProjectId(filePath);
      const metaPath = await this.findMetaPath(filePath);
      const projectRoot = path.dirname(metaPath);

      const allFiles = await this.getAllJavaFiles(projectRoot);

      const fileStates = await Promise.all(
        allFiles.map(async (file) => {
          const fileContent = await fs.readFile(file, "utf-8");
          return { filePath: path.resolve(file), content: fileContent };
        })
      );

      const projectData = await project.findById(projectId);
      const existingLastState =
        projectData?.lastState?.filePathsLastState || [];

      const mergedFileStates = this.mergeLastState(
        existingLastState,
        fileStates
      );

      const update = {
        $set: {
          "lastState.allFilePaths": allFiles.map((f) => path.resolve(f)),
          "lastState.filePathsLastState": mergedFileStates,
        },
      };

      const result = await project.findByIdAndUpdate(projectId, update, {
        new: true,
      });

      if (!result) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      console.log(
        `Saved entire project state. Total files: ${allFiles.length}`
      );
    } catch (error) {
      console.error("Error saving to lastState:", error.message);
      throw error;
    }
  }

  async clearLastState(projectId) {
    await project.updateOne(
      { _id: projectId },
      {
        $set: {
          lastState: {
            allFilePaths: [],
            filePathsLastState: [],
          },
        },
      }
    );
  }

  // Undo refactoring by restoring saved file states
  async undo(filePath) {
    try {
      const projectId = await this.extractProjectId(filePath);
      const projectData = await project.findById(projectId);

      if (!projectData) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const lastState = projectData.lastState;
      const allSavedPaths = lastState?.allFilePaths || [];
      const workspaceDir = path.dirname(filePath);

      if (allSavedPaths.length === 0) {
        console.log("No saved paths in lastState. Skipping file deletion.");
      } else {
        const filesInDir = await this.getAllJavaFiles(workspaceDir);
        for (const file of filesInDir) {
          const normalizedPath = path.normalize(file);
          const isSaved = allSavedPaths.some(
            (savedPath) => path.normalize(savedPath) === normalizedPath
          );
          if (!isSaved) {
            await fs.unlink(file);
            console.log(`Deleted unsaved file: ${file}`);
          }
        }
      }

      for (const file of lastState.filePathsLastState || []) {
        const uri = path.resolve(file.filePath);
        const dir = path.dirname(uri);
        try {
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(uri, file.content, "utf-8");
          console.log(`Restored file: ${uri}`);
        } catch (error) {
          console.error(`Failed to restore file: ${uri}`, error.message);
        }
      }

      console.log("Last state before clearing:", lastState);

      await this.clearLastState(projectId);
      return lastState.filePathsLastState;
    } catch (error) {
      console.error("Error during undo:", error.message);
      throw error;
    }
  }

  // Recursively get all .java files from a directory
  async getAllJavaFiles(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const res = path.resolve(dirPath, entry.name);
        return entry.isDirectory() ? this.getAllJavaFiles(res) : res;
      })
    );
    return files.flat().filter((file) => file.endsWith(".java"));
  }
}

export default RefactorStorage;
