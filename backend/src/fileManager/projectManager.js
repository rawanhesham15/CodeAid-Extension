import fs from "fs/promises";
import path from "path";
import { stat } from "fs/promises";
import fsSync from "fs";
import { exec } from "child_process";
import { readdir } from "fs/promises";
import FileManager from "../fileManager/fileManager.js";
import dbManager from "../dbManager/dbManager.js";
class ProjectManager {
  constructor() {}

  // Locate .codeaid-meta.json and extract the projectId
  async extractProjectId(startPath) {
    const metaPath = await this.findMetaPath(startPath);
    console.log("metaPath", metaPath);
    const metaContent = await fs.readFile(metaPath, "utf-8");
    console.log("metaContent", metaContent);
    const metaData = JSON.parse(metaContent);
    console.log("metaData", metaData);

    const projectId = metaData.projectId;
    console.log("projectId", projectId);
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
  // Undo refactoring by restoring saved file states
  async undoHelper(filePath) {
    const fm = new FileManager();
    const db = new dbManager();
    //const projectManager = new ProjectManager();
    try {
      const projectId = await this.extractProjectId(filePath);
      const projectData = await db.getProjectDocument(projectId);
      if (!projectData) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      const lastState = projectData.lastState;
      const allSavedPaths = lastState?.allFilePaths || [];
      const workspaceDir = path.dirname(filePath);
      if (allSavedPaths.length === 0) {
        console.log("No saved paths in lastState. Skipping file deletion.");
      } else {
        const filesInDir = await fm.getAllJavaFilePaths(workspaceDir);
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
      //console.log("Last state before clearing:", lastState);
      await db.clearLastState(projectId);
      return lastState;
    } catch (error) {
      console.error("Error during undo:", error.message);
      throw error;
    }
  }
  //
async undo(filePath, projectPath) {
  const db = new dbManager();
  const fm = new FileManager();
  const lastState = await this.undoHelper(filePath);
  const paths = await fm.getAllJavaFilePaths(projectPath);
  for (const file of paths) {
    if (!lastState.allFilePaths.includes(file)) {
      try {
        await fs.unlink(file);  // ✅ native delete
        console.log(`Deleted new/unsaved file: ${file}`);
      } catch (err) {
        console.warn(`Failed to delete file: ${file}`, err.message);
      }
    }
  }
  for (const file of lastState.filePathsLastState) {
    const resolvedPath = path.resolve(file.filePath); // absolute path
    const dirPath = path.dirname(resolvedPath);
    try {
      await fs.mkdir(dirPath, { recursive: true });  // ✅ create directory
      await fs.writeFile(resolvedPath, file.content, 'utf-8');  // ✅ write file
      console.log(`Restored file: ${resolvedPath}`);
    } catch (err) {
      console.warn(`Failed to write file: ${resolvedPath}`, err.message);
    }
  }
}
}

export default ProjectManager;
