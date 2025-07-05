import fs from "fs/promises";
import path from "path";
import { stat } from "fs/promises";
import fsSync from "fs";
import project from "../Models/ProjectModel.js";
import FileManager from "../filesManagement/fileManager.js";
import ProjectManager from "../filesManagement/projectManager.js";

class dbManager {
  constructor() {}

  // Save {filePath, content} to the lastState of the corresponding project
  async save(filePath, content) {
    const fm = new FileManager();
    const projectManager = new ProjectManager();

    try {
      const projectId = await projectManager.extractProjectId(filePath);
      const metaPath = await projectManager.findMetaPath(filePath);
      const projectRoot = path.dirname(metaPath);

      const projectData = await project.findById(projectId);

      if (!projectData) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      // Step 1: Clear lastState if it exists
      if (
        projectData.lastState &&
        (projectData.lastState.allFilePaths?.length > 0 ||
          projectData.lastState.filePathsLastState?.length > 0)
      ) {
        await project.findByIdAndUpdate(projectId, {
          $set: {
            "lastState.allFilePaths": [],
            "lastState.filePathsLastState": [],
          },
        });
        console.log(`Cleared old lastState for project ${projectId}`);
      }

      // Step 2: Gather current state
      const allFiles = await fm.getAllJavaFilePaths(projectRoot);

      const fileStates = await Promise.all(
        allFiles.map(async (file) => {
          const fileContent = await fs.readFile(file, "utf-8");
          return { filePath: path.resolve(file), content: fileContent };
        })
      );

      // Save new lastState
      const update = {
        $set: {
          "lastState.allFilePaths": allFiles.map((f) => path.resolve(f)),
          "lastState.filePathsLastState": fileStates,
        },
      };

      const result = await project.findByIdAndUpdate(projectId, update, {
        new: true,
      });

      if (!result) {
        throw new Error(`Project with ID ${projectId} not found during update`);
      }

      console.log(`Saved new project state. Total files: ${allFiles.length}`);
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

  async getLastState(projectId) {
    const projectData = await project.findById(projectId);
    if (!projectData) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    return {
      projectId,
      lastState: projectData.lastState || {
        allFilePaths: [],
        filePathsLastState: [],
      },
    };
  }

  async saveSolidViolations(violations, projectId, dependencies) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    if (!Array.isArray(violations)) {
      throw new Error("Violations must be an array.");
    }

    const allowedPrinciples = ["Single Responsibility", "Open-Closed"];
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
    console.log(`Clearing solid violations for project with ID ${projectId}`);
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
  // having the current filePath, get all Java files in the project and save them in db in lastState
  async setLastState(filePath) {
    const fm = new FileManager();
    const projectDir = path.dirname(filePath);
    const allJavaFiles = await fm.getAllJavaFilePaths(projectDir);
    for (const file of allJavaFiles) {
      const fileContent = await fs.readFile(file, "utf-8");
      await this.save(file, fileContent);
    }
    console.log(
      `All Java files saved in lastState for project at ${projectDir}`
    );
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
        const { projectId } = JSON.parse(
          fsSync.readFileSync(metaFile, "utf-8")
        );
        const existingProject = await project.findById(projectId);
        if (existingProject) {
          return { project: existingProject, fromMeta: true };
        }
      }
      // Create new project
      const newProject = new project({ projectPath: workspacePath });
      await newProject.save();

      // Save meta file
      fsSync.writeFileSync(
        metaFile,
        JSON.stringify({ projectId: newProject._id }),
        "utf-8"
      );

      return { project: newProject, created: true };
    } catch (err) {
      console.error("Error initializing project:", err);
      throw err;
    }
  }
}
export default dbManager;
