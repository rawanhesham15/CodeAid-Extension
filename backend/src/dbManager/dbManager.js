import fs from "fs/promises";
import path from "path";
import { stat } from "fs/promises";
import fsSync from "fs"; 
import project from "../Models/ProjectModel.js";
import FileManager from "../fileManager/fileManager.js";

class dbManager {
  constructor() { }

  // Locate .codeaid-meta.json and extract the projectId
  async extractProjectId(startPath) {
    const metaPath = await this.findMetaPath(startPath);
    console.log("metaPath", metaPath)
    const metaContent = await fs.readFile(metaPath, "utf-8");
    console.log("metaContent", metaContent)
    const metaData = JSON.parse(metaContent);
    console.log("metaData", metaData)

    const projectId = metaData.projectId;
    console.log("projectId", projectId)
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
    const fm = new FileManager();
    try {
      const projectId = await this.extractProjectId(filePath);
      const metaPath = await this.findMetaPath(filePath);
      const projectRoot = path.dirname(metaPath);

      const allFiles = await fm.getAllJavaFiles(projectRoot);

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
    const fm = new FileManager();
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
        const filesInDir = await fm.getAllJavaFiles(workspaceDir);
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
      return lastState;
    } catch (error) {
      console.error("Error during undo:", error.message);
      throw error;
    }
  }

  getAllowedPrinciples() {
    return ["Single Responsibility", "Open-Closed"];
  }
  async saveSolidViolations(violations, projectId, dependencies) {
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
  async saveCouplingViolations(violations, projectId) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    for (const v of violations) {
      // const filePaths = v.filesPaths || [];

      for (const smellGroup of v.couplingSmells || []) {
        const smellFilePaths = smellGroup.filesPaths || [];
        const smells = smellGroup.smells || [];

        const formatted = {
          FilePaths: smellFilePaths,
          couplingSmells: smells.map((s) => ({
            smell: s.smell,
            justification: s.justification,
          })),
        };

        console.log(
          "Formatted coupling violation for saving:",
          JSON.stringify(formatted, null, 2)
        );

        try {
          const updatedProject = await project.findByIdAndUpdate(
            projectId,
            { $push: { couplingViolations: formatted } },
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
    }
  }

  async clearSolidViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { solidViolations: [] } }
    );
  }

  async clearCouplingViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { couplingViolations: [] } }
    );
  }
  async getProjectDocument(projectId) {
    const projectDoc = await project.findById(projectId).lean();
    if (!projectDoc) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    return projectDoc;
  }
  
// having the current filePath, get all Java files in the project and save them in db 
  async storeAllBeforeRefactor(filePath) {
    const fm = new FileManager();
    const projectDir = path.dirname(filePath);
    const allJavaFiles = await fm.getAllJavaFiles(projectDir);
    for (const file of allJavaFiles) {
      const fileContent = await fs.readFile(file, "utf-8");
      await this.save(file, fileContent);
    }
  }

  async initProject(workspacePath) {
    if (!workspacePath) {
      throw new Error("workspacePath is required");
    }

    const metaFile = path.join(workspacePath, ".codeaid-meta.json");

    try {
      // Check if meta file exists
      if (fsSync.existsSync(metaFile)) {
        console.log("Meta file exists:", metaFile);
        const { projectId } = JSON.parse(fsSync.readFileSync(metaFile, "utf-8"));
        const existingProject = await project.findById(projectId);
        if (existingProject) {
          return { project: existingProject, fromMeta: true };
        }
      }
      // Create new project
      const newProject = new project({ projectPath: workspacePath });
      await newProject.save();

      // Save meta file
      fsSync.writeFileSync(metaFile, JSON.stringify({ projectId: newProject._id }), "utf-8");

      return { project: newProject, created: true };
    } catch (err) {
      console.error("Error initializing project:", err);
      throw err;
    }
  }

}

export default dbManager;
