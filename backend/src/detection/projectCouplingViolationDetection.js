import DetectionAction from "./detectionAction.js";
import ProjectDetectCOUPLINGViolationsPG from "./../promptGenerator/projectDetectCouplingViolationsPG.js";
import { readFile } from "fs/promises";
import project from "../Models/ProjectModel.js";
import path from "path";
import getFileWithDependenciesChunked from "../fileManager/filePrepare.js";
import fg from "fast-glob";


class ProjectCOUPLINGViolationDetection extends DetectionAction {
  async getAllJavaFiles(rootDir) {
    return await fg("**/*.java", {
      cwd: rootDir,
      absolute: true,
      ignore: ["**/build/**", "**/node_modules/**"],  // "**/out/**"
    });
  }

  async detectionMethod(req) {
    const projectPath = req?.body?.path;
    console.log(projectPath)
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const metaFilePath = await this.findMetadataFile(projectPath);
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

    await this.clearViolationsForProject(projectId);


    const javaFiles = await this.getAllJavaFiles(projectPath);
    console.log("Found Java files:", javaFiles);
    for (const filePath of javaFiles) {
      try {
        const reqData = await getFileWithDependenciesChunked(filePath, projectPath, projectId);

        let dependencies = [];
        for (const dep of reqData) {
          for (const depFile of dep.dependencies) {
            if (depFile.depFilePath) {
              dependencies.push(depFile.depFilePath);
            }
          }
        }
        const apiData = reqData;

        console.log("filePath", filePath);
        console.log("dependencies  ", dependencies);


        let result;
        try {
          const response = await fetch("http://localhost:8000/detect-coupling", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          });

          if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
          }

          result = await response.json();
          console.log("Coupling Violations:", result);

          let parsed = result;
          console.log("parsed ", parsed);
          await this.saveViolations(parsed, projectId);
          } catch (error) {
          console.error("Error calling detect-solid API:", error);
          throw error;
        }
      } catch (error) {
        console.error(`Failed for ${filePath}:`, error.message);
        continue;
      }
    }
              return this.formatViolationsAsString(parsed);

  }

  // async saveViolations(Violations, projectId) {
  //   if (!projectId || typeof projectId !== "string") {
  //     throw new Error("Invalid project ID");
  //   }

  //   if (!Violations || typeof Violations !== "object" || !Array.isArray(Violations.filesPaths)) {
  //     throw new Error("Invalid violation format.");
  //   }

  //   const formatted = {
  //     FilePaths: Violations.filesPaths,
  //     couplingSmells: Violations.smells,
  //   };

  //   console.log(
  //     "Formatted coupling violations for saving:",
  //     JSON.stringify(formatted, null, 2)
  //   );

  //   try {
  //     const updatedProject = await project.findByIdAndUpdate(
  //       projectId,
  //       { $push: { couplingViolations: [formatted] } }, // store as array of violations
  //       { new: true }
  //     );

  //     if (!updatedProject) {
  //       throw new Error(`Project with ID ${projectId} not found`);
  //     }

  //     console.log("Updated project successfully:", updatedProject._id);
  //   } catch (error) {
  //     console.error(
  //       `Error saving violations for project ${projectId}: ${error.message}`,
  //       {
  //         projectId,
  //         Violations,
  //         stack: error.stack,
  //       }
  //     );
  //     throw error;
  //   }
  // }

  async saveViolations(violations, projectId) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    for (const v of violations) {
      const filePath = v.filesPaths || "unknown";
      const smells = v.couplingSmells || [];

      let formattedViolations = {
        FilePaths: filePath,
        couplingSmells: smells.map((p) => ({
          smell: p.smell,
          justification: p.justification,
        })),
      };

      console.log(
        "Formatted coupling violations for saving:",
        JSON.stringify(formattedViolations, null, 2)
      );

      try {
        const updatedProject = await project.findByIdAndUpdate(
          projectId,
          { $push: { couplingViolations: formattedViolations } },
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

  // formatViolationsAsString(violations) {
  //   return violations
  //     .map((v) => {
  //       const header = `File(s): ${v.filesPaths.join(", ")}`;
  //       const details = v.smells
  //         .map(
  //           (p) =>
  //             `- Principle: ${p.smell}\n  Justification: ${p.justification}`
  //         )
  //         .join("\n");
  //       return `${header}\n${details}`;
  //     })
  //     .join("\n\n");
  // }

  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { couplingViolations: [] } }
    );
  }
}

export default ProjectCOUPLINGViolationDetection;
